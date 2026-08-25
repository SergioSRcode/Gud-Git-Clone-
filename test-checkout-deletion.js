// test-checkout-deletion.js
import checkout from "./checkout.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import readIndex from "./readIndex.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-checkout-del";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// --- Setup: commit1 has only A. commit2 adds B and C. ---
fs.writeFileSync("A.txt", "aaa\n");
add("A.txt");
commit("commit1: only A");
const commit1 = readHead();

fs.writeFileSync("B.txt", "bbb\n");
fs.writeFileSync("C.txt", "ccc\n");
add("B.txt");
add("C.txt");
commit("commit2: A B C");
const commit2 = readHead();

// Test 1: checking out an OLDER commit deletes files it didn't contain
// Currently at commit2 (A, B, C on disk). Check out commit1 (only A).
checkout(commit1);
assert.ok(fs.existsSync("A.txt"), "Test 1 failed: A.txt should still exist");
assert.ok(!fs.existsSync("B.txt"), "Test 1 failed: B.txt should have been deleted");
assert.ok(!fs.existsSync("C.txt"), "Test 1 failed: C.txt should have been deleted");

// Test 2: checking out the NEWER commit again restores the deleted files
checkout(commit2);
assert.ok(fs.existsSync("A.txt"), "Test 2 failed: A.txt missing");
assert.ok(fs.existsSync("B.txt"), "Test 2 failed: B.txt not restored");
assert.ok(fs.existsSync("C.txt"), "Test 2 failed: C.txt not restored");

// Test 3: untracked files are NOT deleted by checkout
// Create an untracked file (never added/committed), then checkout an older commit.
fs.writeFileSync("scratch.txt", "do not delete me\n");
checkout(commit1); // commit1 has only A — B and C should go, scratch must stay
assert.ok(!fs.existsSync("B.txt"), "Test 3 failed: B.txt should be deleted");
assert.ok(fs.existsSync("scratch.txt"), "Test 3 failed: untracked scratch.txt must NOT be deleted");
assert.strictEqual(fs.readFileSync("scratch.txt", "utf-8"), "do not delete me\n", "Test 3 failed: scratch.txt content changed");

// Test 4: the index is updated to match the checked-out commit
// After checking out commit1 (only A), the index should contain A.txt and NOT B/C.
const idxAfterCommit1 = readIndex();
assert.ok("A.txt" in idxAfterCommit1, "Test 4 failed: index should contain A.txt after checkout");
assert.ok(!("B.txt" in idxAfterCommit1), "Test 4 failed: index should NOT contain B.txt after checkout of commit1");
assert.ok(!("C.txt" in idxAfterCommit1), "Test 4 failed: index should NOT contain C.txt after checkout of commit1");

// Test 5: nested deletion — a file in a subdirectory absent from the target is removed
reset();
fs.writeFileSync("root.txt", "root\n");
add("root.txt");
commit("only root file");
const rootOnly = readHead();

fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "nested.js"), "nested\n");
add("src/nested.js");
commit("adds nested file");
const withNested = readHead();

// currently at withNested (root.txt + src/nested.js). Go back to rootOnly.
checkout(rootOnly);
assert.ok(fs.existsSync("root.txt"), "Test 5 failed: root.txt should exist");
assert.ok(!fs.existsSync(path.join("src", "nested.js")), "Test 5 failed: src/nested.js should be deleted");

console.log("All checkout deletion tests passed!");