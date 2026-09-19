import { create } from "zustand";
import type { RoomView, AvatarConfig, ConnectionStatus } from "@game/types";

interface GameState {
  status: ConnectionStatus;
  roomView: RoomView | null;
  error: string | null;
  playerId: string | null;
  reconnectToken: string | null;
  profile: {
    name: string;
    avatar: AvatarConfig;
  };
  setStatus: (status: ConnectionStatus) => void;
  setRoomView: (view: RoomView | null) => void;
  setError: (error: string | null) => void;
  setProfile: (profile: { name: string; avatar: AvatarConfig }) => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: "disconnected",
  roomView: null,
  error: null,
  playerId: null,
  reconnectToken: null,
  profile: {
    name: "Player",
    avatar: {
      style: "bottts",
      seed: "default-seed",
    },
  },
  setStatus: (status) => set({ status }),
  setRoomView: (roomView) => set({ roomView }),
  setError: (error) => set({ error }),
  setProfile: (profile) => set({ profile }),
}));
