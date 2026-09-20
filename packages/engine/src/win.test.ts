import { describe, it, expect } from "bun:test";
import { deepFreeze, createMockContext } from "./test-utils";
import {
  checkWinCondition,
  createGameOverSummary,
  handlePlayAgain,
  abortGameToLobby,
} from "./rules/win";
import { reduce } from "./reduce";
import type { Room, Player, Role } from "@game/types";

function createMockRoomForWinTest(
  civilians: number,
  infiltrators: number,
  undercovers: number = infiltrators
): Room {
  const players: Player[] = [];
  let idCounter = 1;

  const avatar = { style: "bottts", seed: "test" };
  for (let i = 0; i < civilians; i++) {
    players.push({
      id: `p_civ_${idCounter++}`,
      name: `Civ ${i + 1}`,
      tokenHash: `hash_civ_${i}`,
      status: "active",
      presence: "online",
      avatar,
      joinedAt: i + 1,
      lastSeenAt: i + 1,
      role: "CIVILIAN",
      word: "coffee",
    });
  }

  const mrWhites = infiltrators - undercovers;
  for (let i = 0; i < undercovers; i++) {
    players.push({
      id: `p_und_${idCounter++}`,
      name: `Undercover ${i + 1}`,
      tokenHash: `hash_und_${i}`,
      status: "active",
      presence: "online",
      avatar,
      joinedAt: idCounter,
      lastSeenAt: idCounter,
      role: "UNDERCOVER",
      word: "tea",
    });
  }

  for (let i = 0; i < mrWhites; i++) {
    players.push({
      id: `p_mw_${idCounter++}`,
      name: `MrWhite ${i + 1}`,
      tokenHash: `hash_mw_${i}`,
      status: "active",
      presence: "online",
      avatar,
      joinedAt: idCounter,
      lastSeenAt: idCounter,
      role: "MR_WHITE",
      word: undefined,
    });
  }

  return {
    code: "ROOM01",
    createdAt: 1000,
    hostId: players[0]?.id ?? "host",
    locked: false,
    bannedTokenHashes: [],
    phase: "DISCUSSION",
    round: 1,
    endsAt: 5000,
    paused: null,
    settings: {
      maxPlayers: 10,
      undercoverCount: undercovers,
      mrWhiteCount: mrWhites,
      discussionSeconds: 180,
      votingSeconds: 60,
      mrWhiteGuessSeconds: 30,
      category: "Food & Drink",
      difficulty: "easy",
      showRoles: true,
      requireApproval: false,
    },
    players,
    usedPairIds: ["pair_1"],
    game: {
      civilianWord: "coffee",
      undercoverWord: "tea",
      pairId: "pair_1",
      votes: {},
    },
  };
}

describe("Phase 5: Win check and game over", () => {
  describe("Exhaustive win condition table (Spec §3.4) for n = 4..20", () => {
    it("satisfies the exact win condition matrix for all combinations of C and I", () => {
      for (let n = 4; n <= 20; n++) {
        const maxInfiltrators = Math.floor((n - 1) / 2);

        for (let totalI = 1; totalI <= maxInfiltrators; totalI++) {
          const totalC = n - totalI;

          for (let aliveI = 0; aliveI <= totalI; aliveI++) {
            for (let aliveC = 0; aliveC <= totalC; aliveC++) {
              const ucAlive = Math.min(aliveI, Math.ceil(aliveI / 2));
              const mwAlive = aliveI - ucAlive;

              const room = createMockRoomForWinTest(aliveC, aliveI, ucAlive);
              // Also add eliminated players to represent dead players
              for (let deadC = 0; deadC < totalC - aliveC; deadC++) {
                room.players.push({
                  id: `dead_civ_${deadC}`,
                  name: `Dead Civ ${deadC}`,
                  tokenHash: `hash_dc_${deadC}`,
                  status: "eliminated",
                  presence: "online",
                  avatar: { style: "bottts", seed: "test" },
                  joinedAt: 100,
                  lastSeenAt: 100,
                  role: "CIVILIAN",
                  word: "coffee",
                });
              }
              for (let deadI = 0; deadI < totalI - aliveI; deadI++) {
                room.players.push({
                  id: `dead_inf_${deadI}`,
                  name: `Dead Inf ${deadI}`,
                  tokenHash: `hash_di_${deadI}`,
                  status: "eliminated",
                  presence: "online",
                  avatar: { style: "bottts", seed: "test" },
                  joinedAt: 100,
                  lastSeenAt: 100,
                  role: "UNDERCOVER",
                  word: "tea",
                });
              }

              deepFreeze(room);
              const result = checkWinCondition(room);

              if (aliveC === 0 && aliveI === 0) {
                // Nobody left alive -> abort
                expect(result).toEqual({ type: "abort" });
              } else if (aliveI === 0) {
                // All infiltrators eliminated -> Civilians win
                expect(result).toEqual({
                  type: "win",
                  winner: "CIVILIANS",
                  reason: "ALL_INFILTRATORS_ELIMINATED",
                });
              } else if (aliveI >= aliveC) {
                // Infiltrators >= Civilians -> Infiltrators win
                expect(result).toEqual({
                  type: "win",
                  winner: "INFILTRATORS",
                  reason: "INFILTRATORS_EQUAL_OR_GREATER",
                });
              } else {
                // C > I > 0 -> Game continues
                expect(result).toBeNull();
              }
            }
          }
        }
      }
    });
  });

  describe("GameOverSummary creation", () => {
    it("creates full game over summary revealing all roles and words", () => {
      const room = createMockRoomForWinTest(3, 2, 1);
      deepFreeze(room);

      const summary = createGameOverSummary(room, {
        winner: "CIVILIANS",
        reason: "ALL_INFILTRATORS_ELIMINATED",
      });

      expect(summary.winner).toBe("CIVILIANS");
      expect(summary.reason).toBe("ALL_INFILTRATORS_ELIMINATED");
      expect(summary.civilianWord).toBe("coffee");
      expect(summary.undercoverWord).toBe("tea");

      // Verify all 5 players are in playerRoles
      expect(Object.keys(summary.playerRoles).length).toBe(5);
      const civPlayer = room.players.find((p) => p.role === "CIVILIAN")!;
      const ucPlayer = room.players.find((p) => p.role === "UNDERCOVER")!;
      const mwPlayer = room.players.find((p) => p.role === "MR_WHITE")!;

      expect(summary.playerRoles[civPlayer.id]).toEqual({
        role: "CIVILIAN",
        word: "coffee",
      });
      expect(summary.playerRoles[ucPlayer.id]).toEqual({
        role: "UNDERCOVER",
        word: "tea",
      });
      expect(summary.playerRoles[mwPlayer.id]).toEqual({
        role: "MR_WHITE",
        word: null,
      });
    });
  });

  describe("host.playAgain reducer action", () => {
    it("resets game from GAME_OVER to LOBBY, keeps settings and usedPairIds", () => {
      const baseRoom = createMockRoomForWinTest(3, 1, 1);
      // Add waiting player and pending player
      baseRoom.players.push({
        id: "p_wait",
        name: "Waiting Player",
        tokenHash: "hash_wait",
        status: "waiting",
        presence: "online",
        avatar: { style: "bottts", seed: "test" },
        joinedAt: 20,
        lastSeenAt: 20,
      });
      baseRoom.players.push({
        id: "p_pend",
        name: "Pending Player",
        tokenHash: "hash_pend",
        status: "pending",
        presence: "online",
        avatar: { style: "bottts", seed: "test" },
        joinedAt: 21,
        lastSeenAt: 21,
      });
      // Mark one civilian eliminated and disconnected
      baseRoom.players[1]!.status = "eliminated";
      baseRoom.players[1]!.presence = "away";
      baseRoom.players[1]!.disconnectedAt = 1000;

      const gameOverRoom: Room = {
        ...baseRoom,
        phase: "GAME_OVER",
        endsAt: null,
        paused: null,
        game: {
          ...baseRoom.game!,
          gameOver: createGameOverSummary(baseRoom, {
            winner: "CIVILIANS",
            reason: "ALL_INFILTRATORS_ELIMINATED",
          }),
        },
      };

      deepFreeze(gameOverRoom);
      const ctx = createMockContext();

      const result = reduce(
        gameOverRoom,
        { type: "host.playAgain", playerId: gameOverRoom.hostId },
        ctx
      );

      expect(result.error).toBeUndefined();
      const state = result.state;

      expect(state.phase).toBe("LOBBY");
      expect(state.round).toBe(0);
      expect(state.endsAt).toBeNull();
      expect(state.paused).toBeNull();
      expect(state.game).toBeUndefined();
      expect(state.usedPairIds).toEqual(["pair_1"]);
      expect(state.settings.undercoverCount).toBe(1);

      // Verify player statuses:
      // Active connected player remains active, role/word wiped
      const p0 = state.players.find((p) => p.id === baseRoom.players[0]!.id)!;
      expect(p0.status).toBe("active");
      expect(p0.role).toBeUndefined();
      expect(p0.word).toBeUndefined();

      // Eliminated disconnected player becomes active with away presence
      const p1 = state.players.find((p) => p.id === baseRoom.players[1]!.id)!;
      expect(p1.status).toBe("active");
      expect(p1.presence).toBe("away");

      // Waiting connected player becomes active
      const pWait = state.players.find((p) => p.id === "p_wait")!;
      expect(pWait.status).toBe("active");

      // Pending player stays pending
      const pPend = state.players.find((p) => p.id === "p_pend")!;
      expect(pPend.status).toBe("pending");
    });

    it("rejects host.playAgain from non-host", () => {
      const room: Room = {
        ...createMockRoomForWinTest(3, 1, 1),
        phase: "GAME_OVER",
      };
      deepFreeze(room);
      const ctx = createMockContext();

      const result = reduce(
        room,
        { type: "host.playAgain", playerId: room.players[1]!.id },
        ctx
      );

      expect(result.error?.code).toBe("FORBIDDEN");
      expect(result.state).toBe(room);
    });

    it("rejects host.playAgain from invalid phase", () => {
      const room = createMockRoomForWinTest(3, 1, 1);
      deepFreeze(room);
      const ctx = createMockContext();

      const result = reduce(
        room,
        { type: "host.playAgain", playerId: room.hostId },
        ctx
      );

      expect(result.error?.code).toBe("INVALID_PHASE");
      expect(result.state).toBe(room);
    });
  });

  describe("Abort game when nobody left alive", () => {
    it("aborts game back to lobby when all players are eliminated", () => {
      const room = createMockRoomForWinTest(0, 0, 0);
      room.players = [
        {
          id: "p1",
          name: "P1",
          tokenHash: "h1",
          status: "eliminated",
          presence: "online",
          avatar: { style: "bottts", seed: "test" },
          joinedAt: 1,
          lastSeenAt: 1,
        },
        {
          id: "p2",
          name: "P2",
          tokenHash: "h2",
          status: "eliminated",
          presence: "online",
          avatar: { style: "bottts", seed: "test" },
          joinedAt: 2,
          lastSeenAt: 2,
        },
      ];
      deepFreeze(room);

      const aborted = abortGameToLobby(room);
      expect(aborted.phase).toBe("LOBBY");
      expect(aborted.round).toBe(0);
      expect(aborted.game).toBeUndefined();
      expect(aborted.players.every((p) => p.status === "active")).toBe(true);
    });
  });
});
