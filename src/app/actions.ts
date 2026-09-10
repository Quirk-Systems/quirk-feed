"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { validatePost } from "@/lib/feed";

export interface PostFormState {
  error?: string;
  ok?: boolean;
}

export async function createPost(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const author = formData.get("author");
  const body = formData.get("body");
  if (
    (author !== null && typeof author !== "string") ||
    typeof body !== "string"
  ) {
    return { error: "Use text for your handle and post." };
  }
  const result = validatePost({
    author,
    body,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  try {
    getDb().insert(posts).values(result.value).run();
  } catch (error) {
    // Database errors can embed query parameters. Log a code, never the draft.
    const cause = error instanceof Error && error.cause ? error.cause : error;
    const code =
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      typeof cause.code === "string" &&
      /^SQLITE_[A-Z_]+$/.test(cause.code)
        ? cause.code
        : "UNEXPECTED_ERROR";
    console.error("[quirk-feed] Could not save post", { code });
    return {
      error: "Couldn't save your quirk. Your draft is still here. Try again.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
