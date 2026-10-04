"use client";

import { useActionState, useState } from "react";
import { createPost, type PostFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_AUTHOR, MAX_BODY } from "@/lib/feed";

const initialState: PostFormState = {};

export function PostForm() {
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: PostFormState, formData: FormData) => {
      let result: PostFormState;
      try {
        result = await createPost(previous, formData);
      } catch {
        setShowFeedback(true);
        return {
          error:
            "Couldn't confirm your post. Your draft is still here. Check the timeline before retrying.",
        };
      }
      if (result.ok) {
        setAuthor("");
        setBody("");
      }
      setShowFeedback(true);
      return result;
    },
    initialState,
  );

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="flex flex-col gap-3"
    >
      <label htmlFor="post-author" className="text-sm font-medium">
        Handle (optional)
      </label>
      <Input
        id="post-author"
        name="author"
        placeholder="your handle"
        maxLength={MAX_AUTHOR}
        value={author}
        readOnly={pending}
        onChange={(event) => {
          setAuthor(event.target.value);
          setShowFeedback(false);
        }}
      />
      <label htmlFor="post-body" className="text-sm font-medium">
        Post
      </label>
      <Textarea
        id="post-body"
        name="body"
        placeholder="what's the quirk?"
        maxLength={MAX_BODY}
        required
        value={body}
        readOnly={pending}
        aria-describedby="post-help"
        aria-invalid={showFeedback && !!state.error}
        onChange={(event) => {
          setBody(event.target.value);
          setShowFeedback(false);
        }}
      />
      <p id="post-help" className="text-muted-foreground text-xs">
        {body.length}/{MAX_BODY} characters · Blank handles appear as @anon.
      </p>
      {showFeedback && state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <p role="status" className="text-muted-foreground text-sm">
        {pending ? "Posting…" : showFeedback && state.ok ? "Quirk posted." : ""}
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
