import type {
  Room,
  RoomView,
  PlayerPublicView,
  CardView,
  Player,
  CardVariant,
} from "@game/types";

function toPublicView(player: Player, isHost: boolean): PlayerPublicView {
  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    status: player.status,
    presence: player.presence,
    isHost,
    eliminated: player.eliminated
      ? {
          reason: player.eliminated.reason,
          round: player.eliminated.round,
          role: player.eliminated.role,
        }
      : undefined,
  };
}

function computeCard(player: Player, room: Room): CardView | undefined {
  // Card is only available in-game for active (alive) players (Spec §7)
  if (room.phase === "LOBBY" || room.phase === "GAME_OVER") {
    return undefined;
  }

  if (player.status !== "active") {
    return undefined;
  }

  if (!player.role) {
    return undefined;
  }

  // Mr. White always gets variant MR_WHITE and null word (Spec §7)
  if (player.role === "MR_WHITE") {
    return {
      variant: "MR_WHITE",
      word: null,
      role: room.settings.showRoles ? "MR_WHITE" : undefined,
    };
  }

  // If showRoles is false: Civilians and Undercovers get WORD_ONLY, and NO role field (Spec §7)
  if (!room.settings.showRoles) {
    return {
      variant: "WORD_ONLY",
      word: player.word ?? null,
    };
  }

  // If showRoles is true: CIVILIAN or UNDERCOVER with word and role
  const variant: CardVariant =
    player.role === "CIVILIAN" ? "CIVILIAN" : "UNDERCOVER";

  return {
    variant,
    word: player.word ?? null,
    role: player.role,
  };
}

export function viewFor(
  state: Room,
  playerId: string,
  now?: number
): RoomView {
  const isHost = playerId === state.hostId;
  const mePlayer = state.players.find((p) => p.id === playerId);

  // 1. Public roster: non-pending players
  const publicPlayers = state.players
    .filter((p) => p.status !== "pending")
    .map((p) => toPublicView(p, p.id === state.hostId));

  // 2. Pending requests: host only (Spec §5.1)
  let pendingRequests: PlayerPublicView[] | undefined;
  if (isHost) {
    const pending = state.players
      .filter((p) => p.status === "pending")
      .map((p) => toPublicView(p, p.id === state.hostId));
    if (pending.length > 0) {
      pendingRequests = pending;
    }
  }

  // 3. Me representation
  const meStatus = mePlayer?.status ?? "pending";
  const meCard = mePlayer ? computeCard(mePlayer, state) : undefined;
  const myVote =
    state.phase === "VOTING" && mePlayer && mePlayer.status === "active"
      ? (state.game?.votes[playerId] ?? null)
      : undefined;

  // 4. Voting statistics (individual votes hidden until tally per Spec §5.1)
  let votedCount: number | undefined;
  let totalVoters: number | undefined;
  if (state.phase === "VOTING") {
    const alivePlayers = state.players.filter((p) => p.status === "active");
    totalVoters = alivePlayers.length;
    const votes = state.game?.votes ?? {};
    votedCount = Object.keys(votes).length;
  }

  // 5. Last elimination result (only present if tally has run)
  const lastElimination = state.game?.lastElimination;

  // 6. Game over summary (only present at GAME_OVER)
  const gameOver =
    state.phase === "GAME_OVER" ? state.game?.gameOver : undefined;

  return {
    code: state.code,
    phase: state.phase,
    round: state.round,
    endsAt: state.endsAt,
    paused: state.paused,
    locked: state.locked,
    serverNow: now ?? state.createdAt,
    settings: state.settings,
    players: publicPlayers,
    me: {
      id: playerId,
      status: meStatus,
      card: meCard,
      myVote,
    },
    votedCount,
    totalVoters,
    lastElimination,
    pendingRequests,
    gameOver,
  };
}
