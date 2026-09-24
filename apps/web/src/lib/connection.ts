import PartySocket from "partysocket";
import {
  ServerMessageSchema,
  type ClientMessage,
} from "@game/protocol";
import type { Settings } from "@game/types";
import { useGameStore } from "@/stores/gameStore";
import {
  getStoredRoomCredentials,
  setStoredRoomCredentials,
  clearStoredRoomCredentials,
} from "@/lib/storage";

class ConnectionManager {
  private socket: PartySocket | null = null;
  private currentCode: string | null = null;
  private listenersAttached = false;
  private isIntentionalClose = false;

  constructor() {
    this.setupWindowListeners();
  }

  private getWsHost(): string {
    const envHost = (import.meta.env.PUBLIC_WS_HOST as string | undefined)?.trim();
    if (envHost) {
      return envHost.replace(/^(https?|wss?):\/\//, "").replace(/\/+$/, "");
    }
    if (typeof window !== "undefined" && window.location) {
      return window.location.host;
    }
    return "localhost:8787";
  }

  private setupWindowListeners(): void {
    if (typeof window === "undefined" || this.listenersAttached) return;
    this.listenersAttached = true;

    // Spec 10.1: Force reconnect on visibilitychange (visible), pageshow (persisted), and online
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (this.socket && this.currentCode && !this.isIntentionalClose) {
          this.reconnect();
        }
      } else if (document.visibilityState === "hidden") {
        // Spec 7: Auto-hide the info card on tab blur / backgrounded
        useGameStore.getState().setInfoCardVisible(false);
      }
    });

    window.addEventListener("pageshow", (event) => {
      if (event.persisted && this.socket && this.currentCode && !this.isIntentionalClose) {
        this.reconnect();
      }
    });

    window.addEventListener("online", () => {
      if (this.socket && this.currentCode && !this.isIntentionalClose) {
        this.reconnect();
      }
    });

    window.addEventListener("blur", () => {
      // Spec 7: Auto-hide info card on blur
      useGameStore.getState().setInfoCardVisible(false);
    });
  }

  /**
   * Connects to a room via PartySocket and sends the hello handshake.
   */
  public connect(roomCode: string): PartySocket {
    const code = roomCode.toUpperCase().trim();

    // If already connected to this room, return existing socket
    if (this.socket && this.currentCode === code && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    // If connected to another room or socket exists, clean it up
    this.disconnect();

    this.currentCode = code;
    this.isIntentionalClose = false;
    useGameStore.getState().setConnectionStatus("connecting");
    useGameStore.getState().setError(null);

    const host = this.getWsHost();

    const socket = new PartySocket({
      host,
      party: "room",
      room: code,
    });

    socket.addEventListener("open", () => {
      this.sendHello(code);
    });

    socket.addEventListener("message", (event) => {
      this.handleServerMessage(event.data);
    });

    socket.addEventListener("close", (_event) => {
      const store = useGameStore.getState();
      if (this.isIntentionalClose || store.kicked || store.replaced || store.roomClosed) {
        store.setConnectionStatus("disconnected");
      } else {
        store.setConnectionStatus("reconnecting");
      }
    });

    socket.addEventListener("error", (err) => {
      console.error("[PartySocket Error]", err);
    });

    this.socket = socket;
    return socket;
  }

  /**
   * Sends the initial 'hello' authentication and join message.
   */
  public sendHello(roomCode?: string): void {
    const code = (roomCode || this.currentCode)?.toUpperCase().trim();
    if (!code || !this.socket) return;

    const savedCreds = getStoredRoomCredentials(code);
    const profile = useGameStore.getState().profile;

    const helloMsg: ClientMessage = {
      type: "hello",
      payload: {
        code,
        playerId: savedCreds?.playerId,
        token: savedCreds?.token,
        profile: {
          name: profile.name,
          avatar: profile.avatar,
        },
      },
    };

    this.send(helloMsg);
  }

  /**
   * Handles incoming server messages per protocol specification.
   */
  private handleServerMessage(data: unknown): void {
    if (typeof data !== "string") return;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(data);
    } catch {
      console.error("[PartySocket] Non-JSON payload received");
      return;
    }

    const parseResult = ServerMessageSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error("[PartySocket] Invalid server message schema:", parseResult.error);
      return;
    }

    const message = parseResult.data;
    const store = useGameStore.getState();

    switch (message.type) {
      case "state": {
        const { view, token } = message.payload;
        if (this.currentCode) {
          const currentCreds = getStoredRoomCredentials(this.currentCode);
          if (token) {
            setStoredRoomCredentials(this.currentCode, {
              playerId: view.me.id,
              token,
              savedAt: Date.now(),
            });
          } else if (currentCreds && currentCreds.playerId === view.me.id) {
            // Refresh saved timestamp
            setStoredRoomCredentials(this.currentCode, {
              ...currentCreds,
              savedAt: Date.now(),
            });
          }
        }

        store.setRoomView(view as any);
        store.setConnectionStatus("connected");
        store.setError(null);
        break;
      }

      case "error": {
        store.setError(message.payload);
        break;
      }

      case "declined": {
        store.setDeclined({
          isDeclined: true,
          reason: message.payload?.reason,
        });
        this.disconnect();
        break;
      }

      case "kicked": {
        store.setKicked(true);
        if (this.currentCode) {
          clearStoredRoomCredentials(this.currentCode);
        }
        this.disconnect();
        break;
      }

      case "replaced": {
        store.setReplaced(true);
        this.disconnect();
        break;
      }

      case "roomClosed": {
        store.setRoomClosed(true);
        if (this.currentCode) {
          clearStoredRoomCredentials(this.currentCode);
        }
        this.disconnect();
        break;
      }
    }
  }

  /**
   * Sends a typed client message to the server over the WebSocket.
   */
  public send(message: ClientMessage): void {
    if (!this.socket) {
      console.warn("[PartySocket] Cannot send message: socket not initialized");
      return;
    }
    const payload = JSON.stringify(message);
    this.socket.send(payload);
  }

  /**
   * Forces a reconnection of the active socket.
   */
  public reconnect(): void {
    if (this.socket) {
      useGameStore.getState().setConnectionStatus("connecting");
      this.socket.reconnect();
    }
  }

  /**
   * Disconnects the socket intentionally.
   */
  public disconnect(): void {
    this.isIntentionalClose = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentCode = null;
  }

  // --- Convenience Action Dispatchers ---

  public updateProfile(profile: { name?: string; avatar?: any }): void {
    this.send({ type: "profile.update", payload: profile });
  }

  public castVote(targetId: string): void {
    useGameStore.getState().setMyVote(targetId);
    this.send({ type: "vote.cast", payload: { targetId } });
  }

  public mrWhiteGuess(text: string): void {
    this.send({ type: "mrwhite.guess", payload: { text } });
  }

  public leave(): void {
    this.send({ type: "leave" });
    if (this.currentCode) {
      clearStoredRoomCredentials(this.currentCode);
    }
    this.disconnect();
    useGameStore.getState().resetGame();
  }

  public hostUpdateSettings(patch: Partial<Settings>): void {
    this.send({ type: "host.settings.update", payload: patch });
  }

  public hostApprove(playerId: string): void {
    this.send({ type: "host.approve", payload: { playerId } });
  }

  public hostDecline(playerId: string): void {
    this.send({ type: "host.decline", payload: { playerId } });
  }

  public hostKick(playerId: string): void {
    this.send({ type: "host.kick", payload: { playerId } });
  }

  public hostLock(locked: boolean): void {
    this.send({ type: "host.lock", payload: { locked } });
  }

  public hostTransfer(playerId: string): void {
    this.send({ type: "host.transfer", payload: { playerId } });
  }

  public hostStart(): void {
    this.send({ type: "host.start" });
  }

  public hostPause(): void {
    this.send({ type: "host.pause" });
  }

  public hostResume(): void {
    this.send({ type: "host.resume" });
  }

  public hostSkip(): void {
    this.send({ type: "host.skip" });
  }

  public hostEndVoting(): void {
    this.send({ type: "host.endVoting" });
  }

  public hostEndGame(): void {
    this.send({ type: "host.endGame" });
  }

  public hostPlayAgain(): void {
    this.send({ type: "host.playAgain" });
  }
}

export const connection = new ConnectionManager();
