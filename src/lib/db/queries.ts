import { desc, sql } from "drizzle-orm";
import type { openDatabase } from "./connection";
import { posts } from "./schema";

export function readTimeline(db: ReturnType<typeof openDatabase>["db"]) {
  return (
    db
      .select()
      .from(posts)
      // Existing timestamps use seconds. rowid preserves insertion order for ties.
      .orderBy(desc(posts.createdAt), desc(sql`rowid`))
      .limit(100)
      .all()
  );
}
