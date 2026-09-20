import type { Room } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "./types";
import { createRoom } from "./state/create-room";
import { nextAlarm } from "./rules/alarm";
import {
  handleHello,
  handleApprove,
  handleDecline,
  handleKick,
  handleLock,
  handleTransfer,
  handleProfileUpdate,
  handleSettingsUpdate,
} from "./rules/lobby";
import { handleStart } from "./rules/start";
import {
  handleTick,
  handlePause,
  handleResume,
  handleSkip,
  handleEndGame,
} from "./rules/phases";

export function reduce(
  state: Room,
  action: Action,
  ctx: EngineContext
): ReduceResult {
  let result: ReduceResult;

  switch (action.type) {
    case "createRoom": {
      const newRoom = createRoom({
        ...action.payload,
        createdAt: action.payload.createdAt ?? ctx.now,
      });
      result = { state: newRoom };
      break;
    }

    case "hello": {
      result = handleHello(state, action, ctx);
      break;
    }

    case "profile.update": {
      result = handleProfileUpdate(state, action);
      break;
    }

    case "host.approve": {
      result = handleApprove(state, action);
      break;
    }

    case "host.decline": {
      result = handleDecline(state, action);
      break;
    }

    case "host.kick": {
      result = handleKick(state, action);
      break;
    }

    case "host.lock": {
      result = handleLock(state, action);
      break;
    }

    case "host.transfer": {
      result = handleTransfer(state, action);
      break;
    }

    case "host.settings.update": {
      result = handleSettingsUpdate(state, action);
      break;
    }

    case "host.start": {
      result = handleStart(state, action, ctx);
      break;
    }

    case "tick": {
      result = handleTick(state, action, ctx);
      break;
    }

    case "host.pause": {
      result = handlePause(state, action, ctx);
      break;
    }

    case "host.resume": {
      result = handleResume(state, action, ctx);
      break;
    }

    case "host.skip": {
      result = handleSkip(state, action, ctx);
      break;
    }

    case "host.endGame": {
      result = handleEndGame(state, action, ctx);
      break;
    }

    default: {
      result = {
        state,
        error: {
          code: "UNHANDLED_ACTION",
          message: `Action type ${(action as any).type} not supported`,
        },
      };
      break;
    }
  }

  return {
    ...result,
    alarmAt: nextAlarm(result.state),
  };
}
