/*

    This file contains all the constants used in the project.

    Including the keywords to block, the list of websites to block.
    We do not want to hardcode the list of websites to block, so as to prevent this
    file from being used to access those sites. We'll simply block generic keywords
    like lots of security software out there.
*/

import type { CategoryMetadata } from "~types/misc";

// Focus mode animation constants
export const FOCUS_VIEW_TRANSITION_DURATION = 300; // milliseconds

// Task archiving
export const MAX_PAST_TASKS_ARCHIVED = 10;

// Default Pomodoro Duration
export const DEFAULT_WORK_MINUTES = 25;
export const DEFAULT_SHORT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;
export const DEFAULT_SESSIONS_UNTIL_LONG_BREAK = 4;

// Storage throttling constants
export const REDUX_STORAGE_DEBOUNCE_MS = 1000;

// Name of the chrome.alarms alarm that wakes the background worker to
// complete a pomodoro session (fires at focus.sessionEndTime)
export const FOCUS_ALARM_NAME = "focus-session-complete";

// https://www.cisdem.com/resource/list-of-websites-to-block-at-work.html
export const nsfwKeywords: string[] = [
  "porn",
  "adult",
  "xxx",
  "nsfw",
  "sex",
  "hentai",
  "rule34",
  "fetish",
  "nude",
  "xvid",
  "xham",
  "kink",
  "dirty",
  "naughty",
  "milf"
];

// I've excluded Social Media sites that might be useful for work, like
export const socialMediaKeywords: string[] = [
  "facebook",
  "twitter",
  "x.com/",
  "instagram",
  "tiktok",
  "snapchat",
  "reddit",
  "tumblr",
  "myspace",
  "whatsapp",
  "telegram",
  "wechat",
  "line",
  "kik",
  "omegle",
  "periscope",
  "meowchat",
  "youtube"
];

export const datingKeywords: string[] = [
  "tinder",
  "bumble",
  "hinge",
  "grindr",
  "okcupid",
  "match",
  "eharmony",
  "coffeemeetsbagel",
  "plentyoffish",
  "happn"
];

export const gamingKeywords: string[] = [
  "game",
  "gaming",
  "gamer",
  "ign",
  "roblox",
  "play",
  "gaming",
  "playstation",
  "psx",
  "ps2",
  "ps3",
  "ps4",
  "ps5",
  "nintendo",
  "steampowered",
  "fortnite",
  "steamdeck",
  "xbox",
  "steam",
  "online",
  "esports",
  "console",
  "gamble",
  "mmo",
  "multiplayer",
  "arcade",
  "rpg",
  "fps",
  "joystick",
  "twitch"
];

export const entertainmentKeywords: string[] = [
  "netflix",
  "hulu",
  "disney",
  "prime video",
  "hbo",
  "peacock",
  "paramount",
  "movie",
  "film",
  "series",
  "episode",
  "watch",
  "streaming"
];

export const healthKeywords: string[] = [
  "gym",
  "fitness",
  "yoga",
  "peloton",
  "strava",
  "myfitnesspal",
  "workout",
  "exercise",
  "health",
  "wellness"
];

export const shoppingKeywords: string[] = [
  "amazon",
  "ebay",
  "etsy",
  "walmart",
  "target",
  "costco",
  "doordash",
  "ubereats",
  "grubhub",
  "shopping",
  "checkout",
  "cart"
];

export const travelKeywords: string[] = [
  "airbnb",
  "booking",
  "expedia",
  "kayak",
  "tripadvisor",
  "hotels",
  "flight",
  "travel",
  "vacation",
  "destination"
];

export type BadKeywordCategory =
  | "nsfw"
  | "gaming"
  | "social"
  | "dating"
  | "entertainment"
  | "health"
  | "shopping"
  | "travel";

export const badKeywordCategories: readonly BadKeywordCategory[] = [
  "nsfw",
  "gaming",
  "social",
  "dating",
  "entertainment",
  "health",
  "shopping",
  "travel"
];

// The Spread operator is a perfomrance killer. We can probably optimize this later.
export const allBadKeywords = [
  ...nsfwKeywords,
  ...gamingKeywords,
  ...socialMediaKeywords,
  ...datingKeywords,
  ...entertainmentKeywords,
  ...healthKeywords,
  ...shoppingKeywords,
  ...travelKeywords
];

export const CATEGORIES: ReadonlyArray<
  CategoryMetadata & { readonly id: BadKeywordCategory }
> = [
  { id: "nsfw", label: "NSFW", defaultEnabled: true },
  { id: "gaming", label: "Games", defaultEnabled: true },
  { id: "social", label: "Social Media", defaultEnabled: true },
  { id: "dating", label: "Dating", defaultEnabled: true },
  { id: "entertainment", label: "Entertainment", defaultEnabled: true },
  { id: "health", label: "Health & Fitness", defaultEnabled: false },
  { id: "shopping", label: "Shopping & Food", defaultEnabled: false },
  { id: "travel", label: "Travel", defaultEnabled: false }
];

// Map category IDs to their keywords
export const CATEGORY_KEYWORDS: Record<BadKeywordCategory, string[]> = {
  nsfw: nsfwKeywords,
  gaming: gamingKeywords,
  social: socialMediaKeywords,
  dating: datingKeywords,
  entertainment: entertainmentKeywords,
  health: healthKeywords,
  shopping: shoppingKeywords,
  travel: travelKeywords
};

export const focusEncouragementMessages: string[] = [
  "Break time is over! Ready to focus?",
  "Deep work awaits. Let’s get back in the zone.",
  "Shift back into focus mode—you’ve got this.",
  "Time to tune out distractions and dial in.",
  "Let's pick up where you left off and push a little further."
];

export const breakEncouragementMessages: string[] = [
  "Great work! Time for a break.",
  "Nice session—take a moment to recharge.",
  "You've earned a breather. Step away for a bit.",
  "Stand up, stretch, and enjoy a short break.",
  "Pause and reset—your next focus block will be even better."
];
