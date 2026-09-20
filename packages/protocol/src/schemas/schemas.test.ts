import { describe, expect, test } from "bun:test";
import {
  ClientMessageSchema,
  ServerMessageSchema,
  CardViewSchema,
  GameOverSummarySchema,
  EliminationResultSchema,
  RoomViewSchema,
  PhaseSchema,
  RoleSchema,
  PlayerStatusSchema,
  ElimReasonSchema,
  WinnerSchema,
  WinReasonSchema,
  CardVariantSchema,
} from "./index";

describe("Enum Schemas", () => {
  test("PhaseSchema validates all game phases", () => {
    const phases = [
      "LOBBY",
      "ROLE_REVEAL",
      "DISCUSSION",
      "VOTING",
      "ELIMINATION",
      "MRWHITE_GUESS",
      "GAME_OVER",
    ];
    for (const phase of phases) {
      expect(PhaseSchema.parse(phase)).toBe(phase as any);
    }
    expect(() => PhaseSchema.parse("INVALID_PHASE")).toThrow();
  });

  test("RoleSchema validates standard roles", () => {
    expect(RoleSchema.parse("CIVILIAN")).toBe("CIVILIAN");
    expect(RoleSchema.parse("UNDERCOVER")).toBe("UNDERCOVER");
    expect(RoleSchema.parse("MR_WHITE")).toBe("MR_WHITE");
    expect(() => RoleSchema.parse("DETECTIVE")).toThrow();
  });

  test("PlayerStatusSchema validates status values", () => {
    expect(PlayerStatusSchema.parse("pending")).toBe("pending");
    expect(PlayerStatusSchema.parse("waiting")).toBe("waiting");
    expect(PlayerStatusSchema.parse("active")).toBe("active");
    expect(PlayerStatusSchema.parse("eliminated")).toBe("eliminated");
    expect(() => PlayerStatusSchema.parse("spectator")).toThrow();
  });

  test("ElimReasonSchema validates all four elimination reasons (spec §3.6, §10)", () => {
    const reasons = ["VOTED", "DISCONNECTED", "LEFT", "KICKED"] as const;
    for (const reason of reasons) {
      expect(ElimReasonSchema.parse(reason)).toBe(reason);
    }
    expect(() => ElimReasonSchema.parse("TIMEOUT")).toThrow();
    expect(() => ElimReasonSchema.parse("QUIT")).toThrow();
  });

  test("WinnerSchema and WinReasonSchema validate standard win conditions", () => {
    expect(WinnerSchema.parse("CIVILIANS")).toBe("CIVILIANS");
    expect(WinnerSchema.parse("INFILTRATORS")).toBe("INFILTRATORS");
    expect(() => WinnerSchema.parse("CIVILIAN")).toThrow();

    expect(WinReasonSchema.parse("ALL_INFILTRATORS_ELIMINATED")).toBe("ALL_INFILTRATORS_ELIMINATED");
    expect(WinReasonSchema.parse("INFILTRATORS_EQUAL_OR_GREATER")).toBe("INFILTRATORS_EQUAL_OR_GREATER");
    expect(WinReasonSchema.parse("MR_WHITE_GUESSED")).toBe("MR_WHITE_GUESSED");
    expect(() => WinReasonSchema.parse("TIMEOUT")).toThrow();
  });

  test("CardVariantSchema validates card variants", () => {
    expect(CardVariantSchema.parse("MR_WHITE")).toBe("MR_WHITE");
    expect(CardVariantSchema.parse("CIVILIAN")).toBe("CIVILIAN");
    expect(CardVariantSchema.parse("UNDERCOVER")).toBe("UNDERCOVER");
    expect(CardVariantSchema.parse("WORD_ONLY")).toBe("WORD_ONLY");
    expect(() => CardVariantSchema.parse("CUSTOM")).toThrow();
  });
});

describe("CardViewSchema Security & Variants", () => {
  test("allows Mr. White with null word and optional role", () => {
    const validMrWhite = {
      variant: "MR_WHITE",
      word: null,
      role: "MR_WHITE",
    };
    expect(CardViewSchema.parse(validMrWhite)).toEqual(validMrWhite as any);

    const mrWhiteNoRole = {
      variant: "MR_WHITE",
      word: null,
    };
    expect(CardViewSchema.parse(mrWhiteNoRole)).toEqual(mrWhiteNoRole as any);
  });

  test("rejects Mr. White with a non-null word", () => {
    const leakedMrWhite = {
      variant: "MR_WHITE",
      word: "Apple",
    };
    expect(() => CardViewSchema.parse(leakedMrWhite)).toThrow();
  });

  test("allows WORD_ONLY when roles are hidden (no role field)", () => {
    const validWordOnly = {
      variant: "WORD_ONLY",
      word: "Orange",
    };
    expect(CardViewSchema.parse(validWordOnly)).toEqual(validWordOnly as any);
  });

  test("strictly rejects role leakage on WORD_ONLY variant", () => {
    const leakedWordOnly = {
      variant: "WORD_ONLY",
      word: "Orange",
      role: "UNDERCOVER",
    };
    expect(() => CardViewSchema.parse(leakedWordOnly)).toThrow();
  });

  test("allows CIVILIAN and UNDERCOVER variants with word and role", () => {
    const civilian = {
      variant: "CIVILIAN",
      word: "Coffee",
      role: "CIVILIAN",
    };
    expect(CardViewSchema.parse(civilian)).toEqual(civilian as any);

    const undercover = {
      variant: "UNDERCOVER",
      word: "Tea",
      role: "UNDERCOVER",
    };
    expect(CardViewSchema.parse(undercover)).toEqual(undercover as any);
  });
});

describe("ClientMessageSchema (18 client messages)", () => {
  const avatarFixture = {
    style: "bottts",
    seed: "player123",
    options: { primaryColor: "blue" },
  };

  test("parses hello message", () => {
    const msg = {
      type: "hello",
      payload: {
        code: "ABCDEF",
        playerId: "p1",
        token: "tok123",
        profile: {
          name: "Alice",
          avatar: avatarFixture,
        },
      },
    };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses profile.update message", () => {
    const msg = {
      type: "profile.update",
      payload: {
        name: "Alice2",
        avatar: avatarFixture,
      },
    };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses vote.cast message", () => {
    const msg = {
      type: "vote.cast",
      payload: { targetId: "target-42" },
    };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses mrwhite.guess message", () => {
    const msg = {
      type: "mrwhite.guess",
      payload: { text: "Eiffel Tower" },
    };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses leave message", () => {
    const msg = { type: "leave" };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses host.settings.update message", () => {
    const msg = {
      type: "host.settings.update",
      payload: {
        undercoverCount: 2,
        discussionSeconds: 120,
        showRoles: true,
      },
    };
    expect(ClientMessageSchema.parse(msg)).toEqual(msg as any);
  });

  test("parses host.approve and host.decline messages", () => {
    expect(
      ClientMessageSchema.parse({
        type: "host.approve",
        payload: { playerId: "p2" },
      })
    ).toBeDefined();

    expect(
      ClientMessageSchema.parse({
        type: "host.decline",
        payload: { playerId: "p2" },
      })
    ).toBeDefined();
  });

  test("parses host.kick, host.lock, and host.transfer messages", () => {
    expect(
      ClientMessageSchema.parse({
        type: "host.kick",
        payload: { playerId: "p3" },
      })
    ).toBeDefined();

    expect(
      ClientMessageSchema.parse({
        type: "host.lock",
        payload: { locked: true },
      })
    ).toBeDefined();

    expect(
      ClientMessageSchema.parse({
        type: "host.transfer",
        payload: { playerId: "p4" },
      })
    ).toBeDefined();
  });

  test("parses control messages: host.start, host.pause, host.resume, host.skip, host.endVoting, host.endGame, host.playAgain", () => {
    const types = [
      "host.start",
      "host.pause",
      "host.resume",
      "host.skip",
      "host.endVoting",
      "host.endGame",
      "host.playAgain",
    ];
    for (const t of types) {
      expect(ClientMessageSchema.parse({ type: t })).toEqual({ type: t } as any);
    }
  });

  test("rejects invalid client messages", () => {
    // Unknown type
    expect(() => ClientMessageSchema.parse({ type: "unknown.action" })).toThrow();
    // Missing payload for hello
    expect(() => ClientMessageSchema.parse({ type: "hello" })).toThrow();
    // Name exceeding 16 chars
    expect(() =>
      ClientMessageSchema.parse({
        type: "hello",
        payload: {
          code: "ABCDEF",
          profile: {
            name: "ThisNameIsFarTooLongForUndercover",
            avatar: avatarFixture,
          },
        },
      })
    ).toThrow();
    // Empty name
    expect(() =>
      ClientMessageSchema.parse({
        type: "hello",
        payload: {
          code: "ABCDEF",
          profile: {
            name: "",
            avatar: avatarFixture,
          },
        },
      })
    ).toThrow();
  });
});

describe("ServerMessageSchema (6 server messages)", () => {
  test("parses state message with full RoomView", () => {
    const stateMsg = {
      type: "state",
      payload: {
        view: {
          code: "ABCDEF",
          phase: "LOBBY",
          round: 0,
          endsAt: null,
          paused: null,
          locked: false,
          serverNow: 1710000000000,
          settings: {
            undercoverCount: 1,
            mrWhiteCount: 1,
            category: "random",
            difficulty: "medium",
            showRoles: false,
            discussionSeconds: 180,
            votingSeconds: 60,
            mrWhiteGuessSeconds: 30,
            requireApproval: true,
            maxPlayers: 12,
          },
          players: [
            {
              id: "p1",
              name: "Alice",
              avatar: { style: "bottts", seed: "s1" },
              status: "active",
              presence: "online",
              isHost: true,
            },
          ],
          me: {
            id: "p1",
            status: "active",
          },
        },
      },
    };
    expect(ServerMessageSchema.parse(stateMsg)).toBeDefined();
  });

  test("parses error, declined, kicked, replaced, roomClosed messages", () => {
    expect(
      ServerMessageSchema.parse({
        type: "error",
        payload: { code: "NOT_FOUND", message: "Room not found" },
      })
    ).toBeDefined();

    expect(
      ServerMessageSchema.parse({
        type: "declined",
        payload: { reason: "Room is full" },
      })
    ).toBeDefined();

    expect(ServerMessageSchema.parse({ type: "declined" })).toBeDefined();
    expect(ServerMessageSchema.parse({ type: "kicked" })).toBeDefined();
    expect(ServerMessageSchema.parse({ type: "replaced" })).toBeDefined();
    expect(ServerMessageSchema.parse({ type: "roomClosed" })).toBeDefined();
  });

  test("rejects invalid server messages", () => {
    expect(() => ServerMessageSchema.parse({ type: "custom_event" })).toThrow();
    expect(() => ServerMessageSchema.parse({ type: "error" })).toThrow();
  });
});

describe("GameOverSummarySchema", () => {
  test("validates game over summary with all win reasons", () => {
    const reasons = [
      "ALL_INFILTRATORS_ELIMINATED",
      "INFILTRATORS_EQUAL_OR_GREATER",
      "MR_WHITE_GUESSED",
    ] as const;

    for (const reason of reasons) {
      const summary = {
        winner: "CIVILIANS",
        reason,
        civilianWord: "Tea",
        undercoverWord: "Coffee",
        playerRoles: {
          p1: { role: "CIVILIAN", word: "Tea" },
          p2: { role: "UNDERCOVER", word: "Coffee" },
          p3: { role: "MR_WHITE", word: null },
        },
      };
      expect(GameOverSummarySchema.parse(summary)).toEqual(summary as any);
    }
  });

  test("rejects invalid win reason or winner", () => {
    const invalid = {
      winner: "MR_WHITE", // Invalid: winner is CIVILIANS | INFILTRATORS
      reason: "ALL_INFILTRATORS_ELIMINATED",
      civilianWord: "Tea",
      undercoverWord: "Coffee",
      playerRoles: {},
    };
    expect(() => GameOverSummarySchema.parse(invalid)).toThrow();
  });
});

describe("EliminationResultSchema (Spec §3.6, §9.6)", () => {
  test("validates voted elimination with votes breakdown and role reveal", () => {
    const result = {
      eliminatedId: "p2",
      role: "UNDERCOVER",
      reason: "VOTED",
      isTie: false,
      voteCounts: { p1: 1, p2: 4 },
    };
    expect(EliminationResultSchema.parse(result)).toEqual(result as any);
  });

  test("validates disconnected elimination (Spec §10.2)", () => {
    const result = {
      eliminatedId: "p3",
      role: "CIVILIAN",
      reason: "DISCONNECTED",
      isTie: false,
    };
    expect(EliminationResultSchema.parse(result)).toEqual(result as any);
  });

  test("validates tie outcome where nobody is eliminated (Spec §3.5 L5)", () => {
    const tieResult = {
      isTie: true,
      voteCounts: { p1: 3, p2: 3 },
    };
    expect(EliminationResultSchema.parse(tieResult)).toEqual(tieResult as any);
  });

  test("validates multiple round eliminations (disconnect + vote elimination in one round per Spec §3.6)", () => {
    const multiResult = {
      eliminations: [
        {
          id: "p3",
          role: "CIVILIAN" as const,
          reason: "DISCONNECTED" as const,
        },
        {
          id: "p2",
          role: "UNDERCOVER" as const,
          reason: "VOTED" as const,
          voteCounts: { p1: 1, p2: 4 },
        },
      ],
      isTie: false,
      voteCounts: { p1: 1, p2: 4 },
    };
    const parsed = EliminationResultSchema.parse(multiResult);
    expect(parsed.eliminations).toBeDefined();
    expect(parsed.eliminations).toHaveLength(2);
    expect(parsed.eliminations?.[0].reason).toBe("DISCONNECTED");
    expect(parsed.eliminations?.[1].reason).toBe("VOTED");
  });
});

describe("Pending and Waiting Status Handling (Spec §5.1, §9.3, §9.5)", () => {
  const avatarFixture = { style: "bottts", seed: "test" };

  test("validates RoomView with pendingRequests for host and waiting players", () => {
    const viewWithPendingAndWaiting = {
      code: "ABCDEF",
      phase: "DISCUSSION",
      round: 1,
      endsAt: 1710000180000,
      paused: null,
      locked: false,
      serverNow: 1710000000000,
      settings: {
        undercoverCount: 1,
        mrWhiteCount: 1,
        category: "random",
        difficulty: "medium",
        showRoles: false,
        discussionSeconds: 180,
        votingSeconds: 60,
        mrWhiteGuessSeconds: 30,
        requireApproval: true,
        maxPlayers: 12,
      },
      players: [
        {
          id: "p1",
          name: "Alice",
          avatar: avatarFixture,
          status: "active",
          presence: "online",
          isHost: true,
        },
        {
          id: "p2",
          name: "LateJoiner",
          avatar: avatarFixture,
          status: "waiting", // Mid-game joiner waiting for next game (Spec §9.5)
          presence: "online",
          isHost: false,
        },
        {
          id: "p3",
          name: "EliminatedPlayer",
          avatar: avatarFixture,
          status: "eliminated",
          presence: "online",
          isHost: false,
          eliminated: {
            reason: "VOTED",
            round: 1,
            role: "UNDERCOVER",
          },
        },
      ],
      me: {
        id: "p1",
        status: "active",
      },
      pendingRequests: [
        {
          id: "p4",
          name: "KnockingPlayer",
          avatar: avatarFixture,
          status: "pending", // Knocking in lobby waiting room (Spec §9.3)
          presence: "online",
          isHost: false,
        },
      ],
      lastElimination: {
        eliminatedId: "p3",
        role: "UNDERCOVER",
        reason: "VOTED",
        isTie: false,
        voteCounts: { p1: 1, p3: 3 },
      },
    };

    expect(RoomViewSchema.parse(viewWithPendingAndWaiting)).toBeDefined();
  });
});

