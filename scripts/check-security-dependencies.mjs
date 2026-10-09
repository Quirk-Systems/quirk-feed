/* global Bun */
import { readFileSync } from "node:fs";

const ranges = {
  sharp: [0, 35, 5],
  "source-map-js": [1, 2, 2],
};

export function checkResolvedPackages(packages) {
  if (!packages || typeof packages !== "object" || Array.isArray(packages)) {
    throw new Error("Missing or invalid lockfile packages");
  }
  const found = new Set();
  for (const [path, entry] of Object.entries(packages)) {
    const name = Object.keys(ranges).find(
      (packageName) => path === packageName || path.endsWith("/" + packageName),
    );
    if (!name) continue;
    found.add(name);
    const prefix = name + "@";
    const resolved = Array.isArray(entry) ? entry[0] : undefined;
    if (typeof resolved !== "string" || !resolved.startsWith(prefix)) {
      throw new Error("Invalid resolved entry: " + path);
    }
    const version = resolved.slice(prefix.length);
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error("Unverified release version: " + resolved);
    }
    const actual = version.split(".").map(Number);
    const minimum = ranges[name];
    const firstDifference = actual.findIndex((part, i) => part !== minimum[i]);
    if (
      firstDifference !== -1 &&
      actual[firstDifference] < minimum[firstDifference]
    ) {
      throw new Error("Affected dependency: " + resolved + " at " + path);
    }
  }
  for (const name of Object.keys(ranges)) {
    if (!found.has(name))
      throw new Error("Expected dependency missing: " + name);
  }
}

if (import.meta.main) {
  const lock = Bun.JSONC.parse(
    readFileSync(new URL("../bun.lock", import.meta.url), "utf8"),
  );
  checkResolvedPackages(lock.packages);
  console.log(
    "All locked Sharp and source-map-js copies meet the reviewed security floors.",
  );
}
