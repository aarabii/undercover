import type { Room, EliminationRecord, EliminationResult } from "@game/types";
import { DEFAULT_ELIMINATION_SECONDS } from "../constants";

export function closeVotingAndEliminate(room: Room, now: number): Room {
  const eliminations: EliminationRecord[] = [];

  // Step 1: Eliminate still-away active players (Spec §3.6)
  const awayActivePlayers = room.players.filter(
    (p) => p.status === "active" && p.presence === "away"
  );

  let updatedPlayers = room.players.map((p) => {
    if (p.status === "active" && p.presence === "away") {
      return {
        ...p,
        status: "eliminated" as const,
        eliminated: {
          reason: "DISCONNECTED" as const,
          round: room.round,
          role: p.role,
        },
      };
    }
    return p;
  });

  for (const away of awayActivePlayers) {
    eliminations.push({
      id: away.id,
      role: away.role,
      reason: "DISCONNECTED",
    });
  }

  // Step 2: Void votes cast for them (Spec §3.6)
  const votes = { ...(room.game?.votes ?? {}) };
  const disconnectedIds = new Set(awayActivePlayers.map((p) => p.id));
  for (const voterId of Object.keys(votes)) {
    if (disconnectedIds.has(votes[voterId])) {
      delete votes[voterId];
    }
  }

  // Step 3: Tally remaining votes (Spec §3.6)
  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  }

  // Step 4: Eliminate top target (if any)
  const maxVotes = Math.max(0, ...Object.values(voteCounts));
  let isTie = false;

  if (maxVotes === 0) {
    // Nobody voted -> treated as a tie (Spec §3.5)
    isTie = true;
  } else {
    const topTargets = Object.keys(voteCounts).filter(
      (id) => voteCounts[id] === maxVotes
    );

    if (topTargets.length > 1) {
      // Tie for the top -> nobody eliminated (Spec §3.5 L5)
      isTie = true;
    } else {
      isTie = false;
      const eliminatedId = topTargets[0];
      const targetPlayer = updatedPlayers.find((p) => p.id === eliminatedId);
      if (targetPlayer && targetPlayer.status === "active") {
        updatedPlayers = updatedPlayers.map((p) =>
          p.id === eliminatedId
            ? {
                ...p,
                status: "eliminated" as const,
                eliminated: {
                  reason: "VOTED" as const,
                  round: room.round,
                  role: p.role,
                },
              }
            : p
        );
        eliminations.push({
          id: targetPlayer.id,
          role: targetPlayer.role,
          reason: "VOTED",
          voteCounts,
        });
      }
    }
  }

  const votedElim = eliminations.find((e) => e.reason === "VOTED");
  const firstElim = eliminations[0];
  const lastElimination: EliminationResult = {
    eliminations,
    isTie,
    voteCounts,
    eliminatedId: votedElim?.id ?? firstElim?.id,
    role: votedElim?.role ?? firstElim?.role,
    reason: votedElim?.reason ?? firstElim?.reason,
  };

  return {
    ...room,
    players: updatedPlayers,
    phase: "ELIMINATION",
    endsAt: now + DEFAULT_ELIMINATION_SECONDS * 1000,
    paused: null,
    game: room.game
      ? {
          ...room.game,
          votes,
          lastElimination,
        }
      : undefined,
  };
}
