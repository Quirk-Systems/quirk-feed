export const MAX_BODY = 280;
export const MAX_AUTHOR = 40;

export interface NewPost {
  author: string;
  body: string;
}

export type ValidateResult =
  | { ok: true; value: NewPost }
  | { ok: false; error: string };

/** Normalize and validate raw post input from a form submission. */
export function validatePost(input: {
  author?: string | null;
  body?: string | null;
}): ValidateResult {
  const author = (input.author ?? "").trim() || "anon";
  const body = (input.body ?? "").trim();

  if (!body) return { ok: false, error: "Say something first." };
  if (body.length > MAX_BODY) {
    return { ok: false, error: `Keep it under ${MAX_BODY} characters.` };
  }
  if (author.length > MAX_AUTHOR) {
    return {
      ok: false,
      error: `Name must be ${MAX_AUTHOR} characters or fewer.`,
    };
  }

  return { ok: true, value: { author, body } };
}

/** Sort newest-first by createdAt without mutating the input. */
export function sortByNewest<T extends { createdAt: Date }>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

/** Compact relative-time label, e.g. "just now", "5m", "3h", "2d". */
export function relativeTime(from: Date, now: Date = new Date()): string {
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - from.getTime()) / 1000),
  );
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
