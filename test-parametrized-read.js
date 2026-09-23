// test-parametrized-read.js
import readObject from "./readObject.js";
import { parseCommit } from "./commit.js";
import { collectReachableObjects } from "./sync.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT = process.cwd();
const REPO_A = path.join(ROOT, "test-param-A");
const REPO_B = path.join(ROOT, "test-param-B");

function resetBoth() {
  fs.rmSync(REPO_A, { recursive: true, force: true });
  fs.rmSync(REPO_B, { recursive: true, force: true });
  fs.mkdirSync(REPO_A, { recursive: true });
  fs.mkdirSync(REPO_B, { recursive: true });
}

resetBoth();

// Make a commit in REPO_A
process.chdir(REPO_A);
init();
fs.writeFileSync("a.txt", "from A\n");
add("a.txt");
commit("commit in A");
const tipA = readHead();

// Make a DIFFERENT commit in REPO_B
process.chdir(REPO_B);
init();
fs.writeFileSync("b.txt", "from B\n");
add("b.txt");
commit("commit in B");
const tipB = readHead();

// Now standing in REPO_B, read REPO_A's objects by passing its root
// Test 1: readObject with an explicit root reads the OTHER repo's object
const commitAContent = readObject(tipA, REPO_A);
assert.ok(commitAContent !== null, "Test 1 failed: could not read A's commit from B's cwd via root param");
assert.ok(commitAContent.toString("utf-8").startsWith("tree "), "Test 1 failed: A's commit content malformed");

// Test 2: readObject without root still reads the CURRENT repo (B)
const commitBContent = readObject(tipB);
assert.ok(commitBContent.toString("utf-8").includes(""), "Test 2 failed: default-root read broke");
// tipA should NOT be readable from B's store without the root param (B doesn't have A's objects)
assert.strictEqual(readObject(tipA), null, "Test 2 failed: A's object should not exist in B's default store");

// Test 3: parseCommit with root parses the other repo's commit
const parsedA = parseCommit(tipA, REPO_A);
assert.ok(parsedA && parsedA.tree, "Test 3 failed: parseCommit with root failed");
assert.strictEqual(parsedA.parents.length, 0, "Test 3 failed: A's first commit should have 0 parents");

// Test 4: collectReachableObjects with root walks the other repo's history
const reachableA = collectReachableObjects(tipA, REPO_A);
assert.ok(reachableA.has(tipA), "Test 4 failed: reachable set (with root) missing the commit");
assert.ok(reachableA.size >= 3, "Test 4 failed: expected commit+tree+blob at least");

// Test 5: existing default-root behavior unchanged — walk B's own history from B
const reachableB = collectReachableObjects(tipB);
assert.ok(reachableB.has(tipB), "Test 5 failed: default-root reachability broke");

console.log("All parametrized-read tests passed!");