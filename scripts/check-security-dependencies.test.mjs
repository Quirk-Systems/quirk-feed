import assert from "node:assert/strict";
import { test } from "node:test";
import { checkResolvedPackages } from "./check-security-dependencies.mjs";

const safe = {
  sharp: ["sharp@0.35.5"],
  "source-map-js": ["source-map-js@1.2.2"],
};
test("accepts fixed releases and later stable patches", () => {
  checkResolvedPackages(safe);
  checkResolvedPackages({
    sharp: ["sharp@0.35.6"],
    "source-map-js": ["source-map-js@1.2.3"],
  });
});
test("rejects the previously observed vulnerable versions", () => {
  assert.throws(() =>
    checkResolvedPackages({ ...safe, sharp: ["sharp@0.35.4"] }),
  );
  assert.throws(() =>
    checkResolvedPackages({
      ...safe,
      "source-map-js": ["source-map-js@1.2.1"],
    }),
  );
});
test("rejects vulnerable nested copies even when top-level copies are fixed", () => {
  assert.throws(() =>
    checkResolvedPackages({ ...safe, "next/sharp": ["sharp@0.35.4"] }),
  );
  assert.throws(() =>
    checkResolvedPackages({
      ...safe,
      "postcss/source-map-js": ["source-map-js@1.2.1"],
    }),
  );
});
test("fails closed for missing, malformed, aliased or prerelease evidence", () => {
  for (const packages of [
    undefined,
    {},
    [],
    { ...safe, sharp: [] },
    { ...safe, sharp: ["unrelated@99.0.0"] },
    { ...safe, sharp: ["sharp@0.35.5-rc.1"] },
  ]) {
    assert.throws(() => checkResolvedPackages(packages));
  }
});
