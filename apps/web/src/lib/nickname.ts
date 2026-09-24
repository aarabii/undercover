import { GAMING_NAMES } from "@game/words";

/**
 * Returns a random nickname from the game names list, guaranteed to fit within 16 chars.
 */
export function getRandomNickname(): string {
  const eligible = GAMING_NAMES.filter((name) => name.length <= 16);
  if (eligible.length === 0) return "Agent";
  const index = Math.floor(Math.random() * eligible.length);
  return eligible[index];
}
