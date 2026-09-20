import type { EngineContext, WordBank } from "./types";

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as any)[key];
    if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

export function createMockContext(overrides?: Partial<EngineContext>): EngineContext {
  let idCounter = 1;
  return {
    now: 1710000000000,
    rng: () => 0.5,
    newId: () => `player-${idCounter++}`,
    words: {
      getWordPair: () => ({
        id: "pair-1",
        category: "Food",
        difficulty: "medium",
        a: "Coffee",
        b: "Tea",
        accept: ["Espresso", "Latte"],
      }),
    },
    ...overrides,
  };
}
