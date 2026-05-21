import { desc } from "drizzle-orm";
import { ThemeToggle } from "@/components/theme-toggle";
import { PostForm } from "@/components/post-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { relativeTime } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const timeline = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quirk Feed</h1>
          <p className="text-muted-foreground text-sm">
            Post short updates. Watch the timeline.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drop a quirk</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm />
        </CardContent>
      </Card>

      <Separator />

      <section aria-label="Timeline" className="flex flex-col gap-3">
        {timeline.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nothing here yet. Be the first to post.
          </p>
        ) : (
          timeline.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-lg border p-4 shadow-xs"
            >
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
                <span className="text-foreground font-medium">
                  @{post.author}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {relativeTime(post.createdAt)}
                </time>
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.body}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
