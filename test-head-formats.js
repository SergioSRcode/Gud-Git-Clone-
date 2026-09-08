import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-head-formats";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud", "refs", "heads"), { recursive: true });
  process.chdir(TEST_DIR);
}

reset();

// Test 1: attached HEAD with an existing ref returns the branch's commit hash
fs.writeFileSync(path.join(".gud", "HEAD"), "ref: refs/heads/main\n");
fs.writeFileSync(path.join(".gud", "refs", "heads", "main"), "aaaa111122223333444455556666777788889999\n");
assert.strictEqual(readHead(), "aaaa111122223333444455556666777788889999", "Test 1 failed: attached HEAD didn't resolve branch tip");

// Test 2: attached HEAD whose ref file doesn't exist yet returns null
fs.writeFileSync(path.join(".gud", "HEAD"), "ref: refs/heads/newbranch\n");
assert.strictEqual(readHead(), null, "Test 2 failed: attached HEAD with no ref file should be null");

// Test 3: detached HEAD (bare hash) returns that hash directly
fs.writeFileSync(path.join(".gud", "HEAD"), "bbbb111122223333444455556666777788889999\n");
assert.strictEqual(readHead(), "bbbb111122223333444455556666777788889999", "Test 3 failed: detached HEAD didn't return its own hash");

// Test 4: detached HEAD without trailing newline still works
fs.writeFileSync(path.join(".gud", "HEAD"), "cccc111122223333444455556666777788889999");
assert.strictEqual(readHead(), "cccc111122223333444455556666777788889999", "Test 4 failed: detached HEAD without newline failed");

// Test 5: switching back to attached HEAD still resolves correctly
fs.writeFileSync(path.join(".gud", "HEAD"), "ref: refs/heads/main\n");
assert.strictEqual(readHead(), "aaaa111122223333444455556666777788889999", "Test 5 failed: re-attached HEAD didn't resolve");

console.log("All HEAD format tests passed!");