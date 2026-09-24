import { expect, test } from "bun:test";
import { MIN_PLAYERS } from "@game/engine";

test("min players", () => {
  expect(MIN_PLAYERS).toBe(4);
});
