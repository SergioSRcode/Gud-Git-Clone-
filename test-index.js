// test-index.js
import readIndex from "./readIndex.js";
import writeIndex from "./writeIndex.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-index";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud"), { recursive: true });
  process.chdir(TEST_DIR);
}

reset();

// Test 1: reading a non-existent index returns an empty object, doesn't throw
const empty = readIndex();
assert.deepStrictEqual(empty, {}, "Test 1 failed: expected empty object");

// Test 2: writeIndex followed by readIndex round-trips correctly
writeIndex({
  "README.md": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
  "src/app.js": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
});
const result2 = readIndex();
assert.strictEqual(Object.keys(result2).length, 2, "Test 2 failed: expected 2 entries after write");

// Test 3: the actual .gud/index file was written to disk as valid JSON
const raw = fs.readFileSync(path.join(".gud", "index"), "utf-8");
const parsed = JSON.parse(raw); // should not throw
assert.strictEqual(parsed["README.md"], "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", "Test 3 failed: index file content unexpected");

// Test 4: entries preserve path->hash mapping correctly after round-trip
assert.strictEqual(result2["src/app.js"], "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "Test 4 failed: hash mismatch after round-trip");

// Test 5: writing an empty object clears the index file
writeIndex({});
const afterClear = readIndex();
assert.deepStrictEqual(afterClear, {}, "Test 5 failed: expected empty index after clearing");

console.log("All index tests passed!");