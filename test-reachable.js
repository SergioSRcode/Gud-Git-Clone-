// test-reachable.js
import { collectReachableObjects } from "./sync.js"; // put push/pull logic in sync.js (adjust name)
import { parseCommit } from "./commit.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-reachable";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// One commit with a root file and a nested file
fs.writeFileSync("README.md", "readme\n");
fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "app.js"), "app\n");
add("README.md");
add("src/app.js");
commit("first");
const c1 = readHead();

// Test 1: the commit hash itself is in the reachable set
const set1 = collectReachableObjects(c1);
assert.ok(set1.has(c1), "Test 1 failed: commit hash not in reachable set");

// Test 2: the commit's tree hash is reachable
const tree1 = parseCommit(c1).tree;
assert.ok(set1.has(tree1), "Test 2 failed: root tree not reachable");

// Test 3: all blob hashes are reachable (README.md and src/app.js blobs)
// (we don't know the exact hashes here, but the set should contain more than just commit+tree:
//  commit + root tree + src subtree + 2 blobs = at least 5 objects)
assert.ok(set1.size >= 5, `Test 3 failed: expected >=5 reachable objects, got ${set1.size}`);

// Test 4: a second commit's reachable set includes the first commit (ancestor) and its objects
fs.writeFileSync("README.md", "readme v2\n");
add("README.md");
commit("second");
const c2 = readHead();
const set2 = collectReachableObjects(c2);
assert.ok(set2.has(c2), "Test 4 failed: second commit not in its own reachable set");
assert.ok(set2.has(c1), "Test 4 failed: ancestor commit not reachable from descendant");
assert.ok(set2.has(tree1), "Test 4 failed: ancestor's tree not reachable");

// Test 5: reachable set of the first commit does NOT include the second (can't reach forward)
assert.ok(!set1.has(c2), "Test 5 failed: should not reach a descendant commit from an ancestor");

console.log("All reachability tests passed!");