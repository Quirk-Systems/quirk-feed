"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
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
  const result = validatePost({
    author: formData.get("author")?.toString(),
    body: formData.get("body")?.toString(),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  await db.insert(posts).values(result.value);
  revalidatePath("/");
  return { ok: true };
}
