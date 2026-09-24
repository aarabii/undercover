import { describe, expect, test } from "bun:test";
import { createRoom, reduce } from "@game/engine";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Settings } from "@game/types";

describe("Phase 1: Lobby and Settings", () => {
  const avatarFixture = { style: "bottts", seed: "host-seed" };

  function setupLobby(settingsPatch?: Partial<Settings>): { room: Room; ctx: ReturnType<typeof createMockContext> } {
    const ctx = createMockContext({ now: 1000 });
    const room = createRoom({
      code: "ABCDEF",
      hostId: "host-1",
      hostTokenHash: "hash-host",
      hostProfile: { name: "HostAlice", avatar: avatarFixture },
      createdAt: ctx.now,
      settings: settingsPatch,
    });
    return { room, ctx };
  }

  describe("createRoom", () => {
    test("creates room in LOBBY phase with active host player and default settings", () => {
      const { room } = setupLobby();
      expect(room.code).toBe("ABCDEF");
      expect(room.phase).toBe("LOBBY");
      expect(room.round).toBe(0);
      expect(room.hostId).toBe("host-1");
      expect(room.locked).toBe(false);
      expect(room.bannedTokenHashes).toEqual([]);
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toEqual({
        id: "host-1",
        tokenHash: "hash-host",
        name: "HostAlice",
        avatar: avatarFixture,
        status: "active",
        presence: "online",
        joinedAt: 1000,
        lastSeenAt: 1000,
      });
      expect(room.settings.undercoverCount).toBe(1);
      expect(room.settings.mrWhiteCount).toBe(0);
      expect(room.settings.requireApproval).toBe(true);
      expect(room.settings.maxPlayers).toBe(12);
    });
  });

  describe("hello / join", () => {
    test("new player joins as pending when requireApproval is true", () => {
      const { room, ctx } = setupLobby({ requireApproval: true });
      deepFreeze(room);

      const result = reduce(
        room,
        {
          type: "hello",
          tokenHash: "hash-bob",
          payload: {
            code: "ABCDEF",
            profile: { name: "Bob", avatar: { style: "bottts", seed: "bob" } },
          },
        },
        ctx
      );

      expect(result.error).toBeUndefined();
      expect(result.state.players).toHaveLength(2);
      const bob = result.state.players.find((p) => p.name === "Bob");
      expect(bob).toBeDefined();
      expect(bob?.status).toBe("pending");
      expect(bob?.presence).toBe("online");
    });

    test("new player joins as active when requireApproval is false in lobby", () => {
      const { room, ctx } = setupLobby({ requireApproval: false });
      deepFreeze(room);

      const result = reduce(
        room,
        {
          type: "hello",
          tokenHash: "hash-bob",
          payload: {
            code: "ABCDEF",
            profile: { name: "Bob", avatar: { style: "bottts", seed: "bob" } },
          },
        },
        ctx
      );

      expect(result.error).toBeUndefined();
      const bob = result.state.players.find((p) => p.name === "Bob");
      expect(bob?.status).toBe("active");
    });

    test("rejects join when room is locked", () => {
      const { room, ctx } = setupLobby();
      const lockedRoom = { ...room, locked: true };
      deepFreeze(lockedRoom);

      const result = reduce(
        lockedRoom,
        {
          type: "hello",
          tokenHash: "hash-bob",
          payload: {
            code: "ABCDEF",
            profile: { name: "Bob", avatar: avatarFixture },
          },
        },
        ctx
      );

      expect(result.error?.code).toBe("ROOM_LOCKED");
      expect(result.state.players).toHaveLength(1);
    });

    test("rejects join when room is full", () => {
      const { room, ctx } = setupLobby({ maxPlayers: 4 });
      // add 3 more active players so total = 4
      const fullRoom: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p2", tokenHash: "h2", name: "P2", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
          { id: "p3", tokenHash: "h3", name: "P3", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
          { id: "p4", tokenHash: "h4", name: "P4", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(fullRoom);

      const result = reduce(
        fullRoom,
        {
          type: "hello",
          tokenHash: "hash-p5",
          payload: {
            code: "ABCDEF",
            profile: { name: "P5", avatar: avatarFixture },
          },
        },
        ctx
      );

      expect(result.error?.code).toBe("ROOM_FULL");
      expect(result.state.players).toHaveLength(4);
    });

    test("rejects join when player tokenHash is banned", () => {
      const { room, ctx } = setupLobby();
      const bannedRoom: Room = {
        ...room,
        bannedTokenHashes: ["banned-hash"],
      };
      deepFreeze(bannedRoom);

      const result = reduce(
        bannedRoom,
        {
          type: "hello",
          tokenHash: "banned-hash",
          payload: {
            code: "ABCDEF",
            profile: { name: "BadActor", avatar: avatarFixture },
          },
        },
        ctx
      );

      expect(result.error?.code).toBe("BANNED");
      expect(result.state.players).toHaveLength(1);
    });

    test("reconnects returning player and replaces active connection", () => {
      const { room, ctx } = setupLobby();
      const roomWithBob: Room = {
        ...room,
        players: [
          room.players[0],
          {
            id: "bob-id",
            tokenHash: "hash-bob",
            name: "Bob",
            avatar: avatarFixture,
            status: "active",
            presence: "away",
            joinedAt: 500,
            lastSeenAt: 800,
            disconnectedAt: 800,
          },
        ],
      };
      deepFreeze(roomWithBob);

      const result = reduce(
        roomWithBob,
        {
          type: "hello",
          tokenHash: "hash-bob",
          payload: {
            code: "ABCDEF",
            playerId: "bob-id",
            profile: { name: "Bob", avatar: avatarFixture },
          },
        },
        createMockContext({ now: 2000 })
      );

      expect(result.error).toBeUndefined();
      const bob = result.state.players.find((p) => p.id === "bob-id");
      expect(bob?.presence).toBe("online");
      expect(bob?.lastSeenAt).toBe(2000);
      expect(bob?.disconnectedAt).toBeUndefined();
    });
  });

  describe("unique name handling", () => {
    test("suffixes duplicate names with numeric increment (Sam, Sam 2, Sam 3)", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      // Join 1st Sam
      const r1 = reduce(
        room,
        {
          type: "hello",
          tokenHash: "h-sam1",
          payload: { code: "ABCDEF", profile: { name: "Sam", avatar: avatarFixture } },
        },
        ctx
      );
      expect(r1.state.players.find((p) => p.tokenHash === "h-sam1")?.name).toBe("Sam");

      // Join 2nd Sam
      deepFreeze(r1.state);
      const r2 = reduce(
        r1.state,
        {
          type: "hello",
          tokenHash: "h-sam2",
          payload: { code: "ABCDEF", profile: { name: "Sam", avatar: avatarFixture } },
        },
        ctx
      );
      expect(r2.state.players.find((p) => p.tokenHash === "h-sam2")?.name).toBe("Sam 2");

      // Join 3rd Sam
      deepFreeze(r2.state);
      const r3 = reduce(
        r2.state,
        {
          type: "hello",
          tokenHash: "h-sam3",
          payload: { code: "ABCDEF", profile: { name: "Sam", avatar: avatarFixture } },
        },
        ctx
      );
      expect(r3.state.players.find((p) => p.tokenHash === "h-sam3")?.name).toBe("Sam 3");
    });

    test("truncates base name if suffix pushes length over 16 chars", () => {
      const { room, ctx } = setupLobby();
      const longName = "Supercalifragili"; // 16 chars
      const roomWithLong: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p1", tokenHash: "h1", name: longName, avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithLong);

      const res = reduce(
        roomWithLong,
        {
          type: "hello",
          tokenHash: "h2",
          payload: { code: "ABCDEF", profile: { name: longName, avatar: avatarFixture } },
        },
        ctx
      );

      const p2 = res.state.players.find((p) => p.tokenHash === "h2");
      expect(p2).toBeDefined();
      expect(p2!.name.length).toBeLessThanOrEqual(16);
      expect(p2!.name.endsWith(" 2")).toBe(true);
    });
  });

  describe("host approval and decline", () => {
    test("host.approve changes pending player to active in lobby", () => {
      const { room, ctx } = setupLobby();
      const roomWithPending: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p-pending", tokenHash: "hp", name: "PendingBob", avatar: avatarFixture, status: "pending", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithPending);

      const res = reduce(
        roomWithPending,
        { type: "host.approve", playerId: "host-1", payload: { playerId: "p-pending" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      const approved = res.state.players.find((p) => p.id === "p-pending");
      expect(approved?.status).toBe("active");
    });

    test("non-host cannot approve players", () => {
      const { room, ctx } = setupLobby();
      const roomWithPending: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p-pending", tokenHash: "hp", name: "PendingBob", avatar: avatarFixture, status: "pending", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithPending);

      const res = reduce(
        roomWithPending,
        { type: "host.approve", playerId: "not-host", payload: { playerId: "p-pending" } },
        ctx
      );

      expect(res.error?.code).toBe("FORBIDDEN");
      expect(res.state.players.find((p) => p.id === "p-pending")?.status).toBe("pending");
    });

    test("host.decline removes pending player and emits effects", () => {
      const { room, ctx } = setupLobby();
      const roomWithPending: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p-pending", tokenHash: "hp", name: "PendingBob", avatar: avatarFixture, status: "pending", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithPending);

      const res = reduce(
        roomWithPending,
        { type: "host.decline", playerId: "host-1", payload: { playerId: "p-pending" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.players.find((p) => p.id === "p-pending")).toBeUndefined();
      expect(res.effects).toContainEqual({
        type: "send",
        to: "p-pending",
        message: { type: "declined", payload: { reason: "Host declined request" } },
      });
      expect(res.effects).toContainEqual({
        type: "close",
        playerId: "p-pending",
        reason: "declined",
      });
    });
  });

  describe("host kick, lock, transfer", () => {
    test("host.kick removes player in lobby, bans tokenHash, and emits effects", () => {
      const { room, ctx } = setupLobby();
      const roomWithBob: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "bob-id", tokenHash: "bob-hash", name: "Bob", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithBob);

      const res = reduce(
        roomWithBob,
        { type: "host.kick", playerId: "host-1", payload: { playerId: "bob-id" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.players.find((p) => p.id === "bob-id")).toBeUndefined();
      expect(res.state.bannedTokenHashes).toContain("bob-hash");
      expect(res.effects).toContainEqual({ type: "send", to: "bob-id", message: { type: "kicked" } });
      expect(res.effects).toContainEqual({ type: "close", playerId: "bob-id", reason: "kicked" });
    });

    test("host cannot kick themselves", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "host.kick", playerId: "host-1", payload: { playerId: "host-1" } },
        ctx
      );

      expect(res.error?.code).toBe("INVALID_ACTION");
      expect(res.state.players).toHaveLength(1);
    });

    test("host.lock toggles room locked status", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "host.lock", playerId: "host-1", payload: { locked: true } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.locked).toBe(true);
    });

    test("host.transfer moves host crown to another admitted online player", () => {
      const { room, ctx } = setupLobby();
      const roomWithBob: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "bob-id", tokenHash: "bob-hash", name: "Bob", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithBob);

      const res = reduce(
        roomWithBob,
        { type: "host.transfer", playerId: "host-1", payload: { playerId: "bob-id" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.hostId).toBe("bob-id");
    });

    test("host.transfer rejects transferring to pending or away player", () => {
      const { room, ctx } = setupLobby();
      const roomWithPending: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "p-pending", tokenHash: "hp", name: "PendingBob", avatar: avatarFixture, status: "pending", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithPending);

      const res = reduce(
        roomWithPending,
        { type: "host.transfer", playerId: "host-1", payload: { playerId: "p-pending" } },
        ctx
      );

      expect(res.error?.code).toBe("INVALID_TARGET");
      expect(res.state.hostId).toBe("host-1");
    });
  });

  describe("profile.update", () => {
    test("player can update their name and avatar in lobby", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      const newAvatar = { style: "bottts", seed: "alice-new" };
      const res = reduce(
        room,
        { type: "profile.update", playerId: "host-1", payload: { name: "AliceNew", avatar: newAvatar } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.players[0].name).toBe("AliceNew");
      expect(res.state.players[0].avatar).toEqual(newAvatar);
    });

    test("auto-suffixes name if new name collides with another player", () => {
      const { room, ctx } = setupLobby();
      const roomWithBob: Room = {
        ...room,
        players: [
          room.players[0],
          { id: "bob-id", tokenHash: "bob-hash", name: "Bob", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(roomWithBob);

      const res = reduce(
        roomWithBob,
        { type: "profile.update", playerId: "host-1", payload: { name: "Bob" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.players.find((p) => p.id === "host-1")?.name).toBe("Bob 2");
    });
  });

  describe("host.settings.update", () => {
    test("host updates settings with valid patch", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      const res = reduce(
        room,
        {
          type: "host.settings.update",
          playerId: "host-1",
          payload: {
            discussionSeconds: 120,
            showRoles: true,
            mrWhiteCount: 1,
            undercoverCount: 2,
            maxPlayers: 10,
          },
        },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.settings.discussionSeconds).toBe(120);
      expect(res.state.settings.showRoles).toBe(true);
      expect(res.state.settings.mrWhiteCount).toBe(1);
      expect(res.state.settings.undercoverCount).toBe(2);
      expect(res.state.settings.maxPlayers).toBe(10);
    });

    test("rejects settings patch exceeding undercover+mrWhite <= floor((maxPlayers-1)/2)", () => {
      const { room, ctx } = setupLobby({ maxPlayers: 6 });
      deepFreeze(room);

      // maxPlayers=6 -> floor(5/2) = 2 max infiltrators.
      // undercoverCount=2 + mrWhiteCount=1 = 3 > 2 -> invalid
      const res = reduce(
        room,
        {
          type: "host.settings.update",
          playerId: "host-1",
          payload: {
            undercoverCount: 2,
            mrWhiteCount: 1,
          },
        },
        ctx
      );

      expect(res.error?.code).toBe("INVALID_SETTINGS");
      expect(res.state.settings.undercoverCount).toBe(1);
      expect(res.state.settings.mrWhiteCount).toBe(0);
    });

    test("rejects timer durations out of allowed ranges", () => {
      const { room, ctx } = setupLobby();
      deepFreeze(room);

      const res = reduce(
        room,
        {
          type: "host.settings.update",
          playerId: "host-1",
          payload: { discussionSeconds: 5 }, // min is 10
        },
        ctx
      );

      expect(res.error?.code).toBe("INVALID_SETTINGS");
    });
  });
});
