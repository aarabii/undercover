export const CATEGORIES = [
  "Food",
  "Animals",
  "Objects",
  "Places",
  "Entertainment",
  "Companies",
  "Technology",
  "Sports",
  "PopCulture",
  "TravelAndNature",
  "JobsAndRoles",
  "Funny",
] as const;
export type Category = (typeof CATEGORIES)[number];

