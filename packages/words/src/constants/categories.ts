export const CATEGORIES = ["Food", "Animals", "Objects", "Places", "Entertainment"] as const;
export type Category = (typeof CATEGORIES)[number];
