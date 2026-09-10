import "server-only";
import { openDatabase } from "./connection";

const state = globalThis as typeof globalThis & {
  quirkFeedDatabase?: ReturnType<typeof openDatabase>;
};

/** Lazy initialization avoids writing a database during builds; reuse across HMR. */
export function getDb() {
  state.quirkFeedDatabase ??= openDatabase();
  return state.quirkFeedDatabase.db;
}
