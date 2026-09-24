import { describe, it, expect, beforeEach } from "vitest";
import { env, SELF, runInDurableObject, runDurableObjectAlarm, evictDurableObject } from "cloudflare:test";
import type { Room } from "./index";
import { MAX_MESSAGE_BYTES } from "./constants";
import { hashToken } from "./utils";
import type { ServerMessage, ClientMessage } from "@game/protocol";

describe("Undercover Server Shell (apps/server)", () => {
  const avatarFixture = { style: "bottts", seed: "test-seed" };

  describe("1. Origin Check & CORS", () => {
    it("rejects unauthorized Origin on WebSocket handshake with 403 Forbidden", async () => {
      const res = await SELF.fetch("http://localhost/parties/room/TEST01", {
        headers: {
          Upgrade: "websocket",
          Origin: "https://malicious-site.com",
        },
      });
      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain("Forbidden: Origin not allowed");
    });

    it("allows authorized Origin on WebSocket handshake", async () => {
      const res = await SELF.fetch("http://localhost/parties/room/TEST01", {
        headers: {
          Upgrade: "websocket",
          Origin: "http://localhost:4321",
        },
      });
      // A successful upgrade returns 101 Switching Protocols
      expect(res.status).toBe(101);
      expect(res.webSocket).toBeDefined();
      res.webSocket?.accept();
      res.webSocket?.close();
    });

    it("handles CORS OPTIONS preflight correctly", async () => {
      const res = await SELF.fetch("http://localhost/rooms", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:4321",
        },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:4321");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });
  });

  describe("2. REST Endpoints", () => {
    it("POST /rooms creates a reserved 6-character room code", async () => {
      const res = await SELF.fetch("http://localhost/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:4321",
        },
        body: JSON.stringify({ turnstileToken: "test-turnstile-token" }),
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as { code: string };
      expect(data.code).toBeDefined();
      expect(data.code).toHaveLength(6);
      expect(data.code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);

      // Verify GET /rooms/:code confirms it exists and is reserved
      const statusRes = await SELF.fetch(`http://localhost/rooms/${data.code}`, {
        headers: { Origin: "http://localhost:4321" },
      });
      expect(statusRes.status).toBe(200);
      const status = (await statusRes.json()) as { exists: boolean; locked: boolean; full: boolean; inGame: boolean };
      expect(status.exists).toBe(true);
      expect(status.locked).toBe(false);
      expect(status.full).toBe(false);
      expect(status.inGame).toBe(false);
    });

    it("GET /rooms/:code returns exists=false for non-existent room", async () => {
      const res = await SELF.fetch("http://localhost/rooms/NONEX1", {
        headers: { Origin: "http://localhost:4321" },
      });
      expect(res.status).toBe(200);
      const status = (await res.json()) as { exists: boolean };
      expect(status.exists).toBe(false);
    });

    it("GET /rooms/:code rejects invalid code format with 400", async () => {
      const res = await SELF.fetch("http://localhost/rooms/SHORT", {
        headers: { Origin: "http://localhost:4321" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("3. WebSocket Connection & Hello Lifecycle", () => {
    it("rejects messages exceeding 2KB with MESSAGE_TOO_LARGE", async () => {
      const stub = env.Room.get(env.Room.idFromName("SIZE01"));
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        let sentMessage: string | null = null;
        const mockConn: any = {
          id: "conn-1",
          state: null,
          setState(s: any) { this.state = s; },
          send(msg: string) { sentMessage = msg; },
          close() {},
        };

        const hugePayload = "a".repeat(MAX_MESSAGE_BYTES + 10);
        await room.onMessage(mockConn, hugePayload);

        expect(sentMessage).not.toBeNull();
        const parsed = JSON.parse(sentMessage!) as ServerMessage;
        expect(parsed.type).toBe("error");
        if (parsed.type === "error") {
          expect(parsed.payload.code).toBe("MESSAGE_TOO_LARGE");
        }
      });
    });

    it("rejects binary and malformed JSON messages with appropriate error codes", async () => {
      const stub = env.Room.get(env.Room.idFromName("MALF01"));
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        let sentMessage: string | null = null;
        const mockConn: any = {
          id: "conn-1",
          state: null,
          setState(s: any) { this.state = s; },
          send(msg: string) { sentMessage = msg; },
          close() {},
        };

        // Binary message
        await room.onMessage(mockConn, new ArrayBuffer(16));
        expect(JSON.parse(sentMessage!).payload.code).toBe("INVALID_FORMAT");

        // Malformed JSON
        await room.onMessage(mockConn, "{not a valid json}");
        expect(JSON.parse(sentMessage!).payload.code).toBe("BAD_JSON");

        // Invalid Zod schema
        await room.onMessage(mockConn, JSON.stringify({ type: "unknown.action" }));
        expect(JSON.parse(sentMessage!).payload.code).toBe("INVALID_MESSAGE");
      });
    });

    it("handles join, approve, decline, and waiting flow across players", async () => {
      const stub = env.Room.get(env.Room.idFromName("FLOW01"));
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        const conns: Record<string, { state: any; messages: string[]; closed: boolean }> = {};
        function createMockConn(id: string) {
          conns[id] = { state: null, messages: [], closed: false };
          return {
            id,
            state: null,
            setState(s: any) {
              conns[id].state = s;
              (this as any).state = s;
            },
            send(msg: string) { conns[id].messages.push(msg); },
            close() { conns[id].closed = true; },
          } as any;
        }

        const hostConn = createMockConn("host-conn");
        const bobConn = createMockConn("bob-conn");
        const charlieConn = createMockConn("charlie-conn");

        // Mock room.getConnections() to return all mock connections
        room.getConnections = function* () {
          yield hostConn;
          yield bobConn;
          yield charlieConn;
        };

        // 1. Host sends hello -> creates room as host
        await room.onMessage(hostConn, JSON.stringify({
          type: "hello",
          payload: {
            code: "FLOW01",
            profile: { name: "HostAlice", avatar: avatarFixture },
          },
        }));

        expect(room.roomState).not.toBeNull();
        expect(room.roomState?.hostId).toBeDefined();
        const hostId = room.roomState!.hostId;
        expect(hostConn.state.playerId).toBe(hostId);
        expect(conns["host-conn"].messages).toHaveLength(1);
        const hostStateMsg = JSON.parse(conns["host-conn"].messages[0]);
        expect(hostStateMsg.type).toBe("state");
        expect(hostStateMsg.payload.token).toBeDefined(); // Issued fresh token on first join
        const mePlayer = hostStateMsg.payload.view.players.find((p: any) => p.id === hostStateMsg.payload.view.me.id);
        expect(mePlayer?.isHost).toBe(true);

        // 2. Bob sends hello -> joins as pending (requireApproval is true by default)
        await room.onMessage(bobConn, JSON.stringify({
          type: "hello",
          payload: {
            code: "FLOW01",
            profile: { name: "Bob", avatar: avatarFixture },
          },
        }));

        const bobPlayer = room.roomState!.players.find((p) => p.name === "Bob");
        expect(bobPlayer).toBeDefined();
        expect(bobPlayer!.status).toBe("pending");
        expect(bobConn.state.playerId).toBe(bobPlayer!.id);

        // 3. Charlie sends hello -> also pending
        await room.onMessage(charlieConn, JSON.stringify({
          type: "hello",
          payload: {
            code: "FLOW01",
            profile: { name: "Charlie", avatar: avatarFixture },
          },
        }));
        const charliePlayer = room.roomState!.players.find((p) => p.name === "Charlie");
        expect(charliePlayer).toBeDefined();
        expect(charliePlayer!.status).toBe("pending");

        // 4. Host approves Bob
        await room.onMessage(hostConn, JSON.stringify({
          type: "host.approve",
          payload: { playerId: bobPlayer!.id },
        }));
        expect(room.roomState!.players.find((p) => p.id === bobPlayer!.id)!.status).toBe("active");

        // 5. Host declines Charlie
        await room.onMessage(hostConn, JSON.stringify({
          type: "host.decline",
          payload: { playerId: charliePlayer!.id },
        }));
        expect(room.roomState!.players.find((p) => p.id === charliePlayer!.id)).toBeUndefined();
        expect(conns["charlie-conn"].closed).toBe(true);
        const lastCharlieMsg = JSON.parse(conns["charlie-conn"].messages[conns["charlie-conn"].messages.length - 1]);
        expect(lastCharlieMsg.type).toBe("declined");
      });
    });

    it("handles reconnect with matching token without reissuing raw token", async () => {
      const stub = env.Room.get(env.Room.idFromName("RECON1"));
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        let hostMsg: string = "";
        const hostConn: any = {
          id: "host-1",
          state: null,
          setState(s: any) { this.state = s; },
          send(m: string) { hostMsg = m; },
          close() {},
        };
        room.getConnections = function* () { yield hostConn; };

        // 1. Initial join with custom token
        const rawToken = "secret-token-123456789";
        await room.onMessage(hostConn, JSON.stringify({
          type: "hello",
          payload: {
            code: "RECON1",
            token: rawToken,
            profile: { name: "HostAlice", avatar: avatarFixture },
          },
        }));

        const hostId = room.roomState!.hostId;
        const initialMsg = JSON.parse(hostMsg);
        expect(initialMsg.type).toBe("state");
        expect(initialMsg.payload.token).toBe(rawToken);

        // 2. Disconnect
        await room.onClose(hostConn);
        expect(room.roomState!.players[0].presence).toBe("away");

        // 3. Reconnect with the same token
        let reconMsg: string = "";
        const reconConn: any = {
          id: "recon-1",
          state: null,
          setState(s: any) { this.state = s; },
          send(m: string) { reconMsg = m; },
          close() {},
        };
        room.getConnections = function* () { yield reconConn; };

        await room.onMessage(reconConn, JSON.stringify({
          type: "hello",
          payload: {
            code: "RECON1",
            playerId: hostId,
            token: rawToken,
            profile: { name: "HostAlice", avatar: avatarFixture },
          },
        }));

        expect(room.roomState!.players[0].presence).toBe("online");
        const parsedRecon = JSON.parse(reconMsg);
        expect(parsedRecon.type).toBe("state");
        expect(parsedRecon.payload.token).toBeUndefined(); // Raw token is NEVER resent on reconnect
      });
    });

    it("replaces older tab connection when second tab joins with same credentials", async () => {
      const stub = env.Room.get(env.Room.idFromName("TAB001"));
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        const rawToken = "multi-tab-token-xyz";
        let tab1Closed = false;
        let tab1LastMsg = "";
        const tab1: any = {
          id: "tab-1",
          state: null,
          setState(s: any) { this.state = s; },
          send(m: string) { tab1LastMsg = m; },
          close() { tab1Closed = true; },
        };

        room.getConnections = function* () {
          yield tab1;
        };

        // Tab 1 joins
        await room.onMessage(tab1, JSON.stringify({
          type: "hello",
          payload: {
            code: "TAB001",
            token: rawToken,
            profile: { name: "HostAlice", avatar: avatarFixture },
          },
        }));

        const playerId = room.roomState!.hostId;
        expect(tab1.state.playerId).toBe(playerId);

        // Tab 2 connects with same token while Tab 1 is still online
        let tab2LastMsg = "";
        const tab2: any = {
          id: "tab-2",
          state: null,
          setState(s: any) { this.state = s; },
          send(m: string) { tab2LastMsg = m; },
          close() {},
        };

        room.getConnections = function* () {
          yield tab1;
          yield tab2;
        };

        await room.onMessage(tab2, JSON.stringify({
          type: "hello",
          payload: {
            code: "TAB001",
            playerId,
            token: rawToken,
            profile: { name: "HostAlice", avatar: avatarFixture },
          },
        }));

        // Tab 1 received replaced message and was closed
        expect(tab1Closed).toBe(true);
        expect(JSON.parse(tab1LastMsg).type).toBe("replaced");

        // Tab 2 is active
        expect(tab2.state.playerId).toBe(playerId);
        expect(JSON.parse(tab2LastMsg).type).toBe("state");
      });
    });
  });

  describe("4. Alarms, Hibernation, and State Persistence", () => {
    it("survives simulated DO restart/hibernation across alarm phase transitions", async () => {
      const stub = env.Room.get(env.Room.idFromName("ALARM1"));

      // 1. Initialize room with 4 players and start game
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        const dummyConn: any = {
          id: "dummy",
          state: null,
          setState(s: any) { this.state = s; },
          send() {},
          close() {},
        };
        room.getConnections = function* () { yield dummyConn; };

        // Create host
        await room.onMessage(dummyConn, JSON.stringify({
          type: "hello",
          payload: { code: "ALARM1", profile: { name: "Host", avatar: avatarFixture } },
        }));

        // Add 3 more active players
        for (let i = 1; i <= 3; i++) {
          const pConn: any = {
            id: `p${i}`,
            state: null,
            setState(s: any) { this.state = s; },
            send() {},
            close() {},
          };
          await room.onMessage(pConn, JSON.stringify({
            type: "hello",
            payload: { code: "ALARM1", profile: { name: `Player${i}`, avatar: avatarFixture } },
          }));
          const p = room.roomState!.players.find((pl) => pl.name === `Player${i}`)!;
          await room.onMessage(dummyConn, JSON.stringify({
            type: "host.approve",
            payload: { playerId: p.id },
          }));
        }

        expect(room.roomState!.players.filter((p) => p.status === "active")).toHaveLength(4);

        // Host starts the game -> phase changes to ROLE_REVEAL with alarm set
        await room.onMessage(dummyConn, JSON.stringify({ type: "host.start" }));
        expect(room.roomState!.phase).toBe("ROLE_REVEAL");
        expect(room.roomState!.endsAt).toBeDefined();
      });

      // 2. Simulate complete Durable Object restart / eviction
      await evictDurableObject(stub);

      // 3. Fast-forward alarm to transition ROLE_REVEAL -> DISCUSSION
      const ran = await runDurableObjectAlarm(stub);
      expect(ran).toBe(true);

      // 4. Verify recovered state inside new DO instance
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        expect(room.roomState).not.toBeNull();
        expect(room.roomState!.phase).toBe("DISCUSSION");
        expect(room.roomState!.round).toBe(1);
      });
    });

    it("purges storage on 30-min idle alarm", async () => {
      const stub = env.Room.get(env.Room.idFromName("IDLE01"));

      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        const conn: any = {
          id: "conn-idle",
          state: null,
          setState(s: any) { this.state = s; },
          send() {},
          close() {},
        };
        room.getConnections = function* () { yield conn; };

        await room.onMessage(conn, JSON.stringify({
          type: "hello",
          payload: { code: "IDLE01", profile: { name: "Host", avatar: avatarFixture } },
        }));
        expect(room.roomState).not.toBeNull();

        // Disconnect and empty all connections
        room.getConnections = function* () {};
        await room.onClose(conn);
      });

      // 1. Run 15s lobby disconnect grace alarm (removes away player from lobby roster)
      const ranGrace = await runDurableObjectAlarm(stub);
      expect(ranGrace).toBe(true);

      // 2. Run 30-minute idle cleanup alarm (purges abandoned empty room)
      const ranCleanup = await runDurableObjectAlarm(stub);
      expect(ranCleanup).toBe(true);

      // Verify room state is cleaned up
      await runInDurableObject(stub, async (room: Room) => {
        await room.onStart();
        expect(room.roomState).toBeNull();
      });
    });
  });
});
