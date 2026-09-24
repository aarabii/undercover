import { create } from "zustand";
import type { RoomView, ConnectionStatus } from "@game/types";
import {
  getStoredProfile,
  setStoredProfile,
  type StoredProfile,
} from "@/lib/storage";

export interface GameStoreState {
  // Connection & Room state
  connectionStatus: ConnectionStatus;
  roomView: RoomView | null;
  myVote: string | null;

  // Server notifications / lifecycle states
  error: { code: string; message: string } | null;
  declined: { isDeclined: boolean; reason?: string } | null;
  kicked: boolean;
  replaced: boolean;
  roomClosed: boolean;

  // Player identity & local preferences
  profile: StoredProfile;

  // Local UI toggles
  isInfoCardVisible: boolean;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRoomView: (view: RoomView | null) => void;
  setMyVote: (vote: string | null) => void;
  setError: (error: { code: string; message: string } | null) => void;
  setDeclined: (declined: { isDeclined: boolean; reason?: string } | null) => void;
  setKicked: (kicked: boolean) => void;
  setReplaced: (replaced: boolean) => void;
  setRoomClosed: (closed: boolean) => void;
  setProfile: (profile: StoredProfile) => void;
  toggleInfoCard: () => void;
  setInfoCardVisible: (visible: boolean) => void;
  resetGame: () => void;
}

const DEFAULT_PROFILE: StoredProfile = {
  name: "Agent",
  avatar: {
    style: "bottts",
    seed: "agent-1",
  },
};

export const useGameStore = create<GameStoreState>((set) => ({
  connectionStatus: "disconnected",
  roomView: null,
  myVote: null,

  error: null,
  declined: null,
  kicked: false,
  replaced: false,
  roomClosed: false,

  profile: getStoredProfile() ?? DEFAULT_PROFILE,

  isInfoCardVisible: false,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRoomView: (roomView) =>
    set((state) => ({
      roomView,
      // Keep myVote synchronized with server view if provided
      myVote: roomView?.me?.myVote !== undefined ? roomView.me.myVote : state.myVote,
    })),

  setMyVote: (myVote) => set({ myVote }),

  setError: (error) => set({ error }),

  setDeclined: (declined) => set({ declined, connectionStatus: "disconnected" }),

  setKicked: (kicked) => set({ kicked, connectionStatus: "disconnected" }),

  setReplaced: (replaced) => set({ replaced, connectionStatus: "disconnected" }),

  setRoomClosed: (roomClosed) => set({ roomClosed, connectionStatus: "disconnected" }),

  setProfile: (profile) => {
    setStoredProfile(profile);
    set({ profile });
  },

  toggleInfoCard: () => set((state) => ({ isInfoCardVisible: !state.isInfoCardVisible })),

  setInfoCardVisible: (isInfoCardVisible) => set({ isInfoCardVisible }),

  resetGame: () =>
    set({
      connectionStatus: "disconnected",
      roomView: null,
      myVote: null,
      error: null,
      declined: null,
      kicked: false,
      replaced: false,
      roomClosed: false,
      isInfoCardVisible: false,
    }),
}));
