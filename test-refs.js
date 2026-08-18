// test-refs.js
import readHead from "./readHead.js";
import updateRef from "./updateRef.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-refs";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud", "refs", "heads"), { recursive: true });
  fs.writeFileSync(path.join(TEST_DIR, ".gud", "HEAD"), "ref: refs/heads/main\n");
  process.chdir(TEST_DIR);
}

reset();

// Test 1: readHead returns null when no commits exist yet
assert.strictEqual(readHead(), null, "Test 1 failed: expected null when ref file doesn't exist");

// Test 2: updateRef creates the ref file with the given hash
updateRef("aaaa8fe5ccb19ba61c4c0873d391e987982fbbd3");
assert.ok(fs.existsSync(path.join(".gud", "refs", "heads", "main")), "Test 2 failed: ref file not created");

// Test 3: readHead returns the hash that updateRef wrote
assert.strictEqual(readHead(), "aaaa8fe5ccb19ba61c4c0873d391e987982fbbd3", "Test 3 failed: readHead didn't return written hash");

// Test 4: updateRef overwrites an existing ref (doesn't append)
updateRef("bbbb8fe5ccb19ba61c4c0873d391e987982fbbd3");
assert.strictEqual(readHead(), "bbbb8fe5ccb19ba61c4c0873d391e987982fbbd3", "Test 4 failed: ref not overwritten correctly");

// Test 5: readHead respects a different branch in HEAD
fs.writeFileSync(path.join(".gud", "HEAD"), "ref: refs/heads/feature\n");
assert.strictEqual(readHead(), null, "Test 5 failed: expected null for branch with no commits");
updateRef("cccc8fe5ccb19ba61c4c0873d391e987982fbbd3");
assert.strictEqual(readHead(), "cccc8fe5ccb19ba61c4c0873d391e987982fbbd3", "Test 5 failed: didn't read/write the feature branch ref");
assert.strictEqual(
  fs.readFileSync(path.join(".gud", "refs", "heads", "main"), "utf-8").trim(),
  "bbbb8fe5ccb19ba61c4c0873d391e987982fbbd3",
  "Test 5 failed: writing feature branch clobbered main"
);

console.log("All refs tests passed!");