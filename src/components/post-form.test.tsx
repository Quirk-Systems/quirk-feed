// @vitest-environment jsdom
import "@/__tests__/setup";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import type { PostFormState } from "@/app/actions";

const mocks = vi.hoisted(() => ({ createPost: vi.fn() }));
vi.mock("@/app/actions", () => ({ createPost: mocks.createPost }));
import { PostForm } from "./post-form";

beforeEach(() => {
  mocks.createPost.mockReset();
});

it("preserves a draft when the action cannot be confirmed, then clears it on success", async () => {
  mocks.createPost
    .mockRejectedValueOnce(new Error("connection interrupted"))
    .mockResolvedValueOnce({ ok: true });
  const user = userEvent.setup();
  render(<PostForm />);
  await user.type(screen.getByLabelText("Handle (optional)"), "bry");
  await user.type(screen.getByLabelText("Post"), "Don't lose this");
  await user.click(screen.getByRole("button", { name: "Post" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Couldn't confirm your post",
  );
  expect(screen.getByLabelText("Post")).toHaveValue("Don't lose this");
  expect(screen.getByLabelText("Handle (optional)")).toHaveValue("bry");
  await user.click(screen.getByRole("button", { name: "Post" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Quirk posted.");
  expect(screen.getByLabelText("Post")).toHaveValue("");
});

it("prevents a second submission and draft edits while a post is pending", async () => {
  let resolvePost!: (value: PostFormState) => void;
  mocks.createPost.mockImplementation(
    () =>
      new Promise<PostFormState>((resolve) => {
        resolvePost = resolve;
      }),
  );
  const user = userEvent.setup();
  render(<PostForm />);
  await user.type(screen.getByLabelText("Post"), "One post");
  await user.click(screen.getByRole("button", { name: "Post" }));
  const pending = screen.getByRole("button", { name: "Posting…" });
  expect(pending).toBeDisabled();
  expect(screen.getByLabelText("Post")).toHaveAttribute("readonly");
  await user.click(pending);
  expect(mocks.createPost).toHaveBeenCalledOnce();
  await act(async () => resolvePost({ ok: true }));
});
