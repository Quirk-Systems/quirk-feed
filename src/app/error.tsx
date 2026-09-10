"use client";

import { Button } from "@/components/ui/button";

export default function FeedError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">The feed couldn&apos;t load.</h1>
      <p role="alert">Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
