"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPost, type PostFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_BODY } from "@/lib/feed";

const initialState: PostFormState = {};

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPost, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <Input
        name="author"
        placeholder="your handle (optional)"
        maxLength={40}
        aria-label="Handle"
      />
      <Textarea
        name="body"
        placeholder="what's the quirk?"
        maxLength={MAX_BODY}
        required
        aria-label="Post"
      />
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
