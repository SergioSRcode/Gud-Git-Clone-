// test-checkout-branches.js
import checkout from "./checkout.js";
import createBranch from "./createBranch.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-checkout-branches";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

function headRaw() {
  return fs.readFileSync(path.join(".gud", "HEAD"), "utf-8").trim();
}

reset();

// Setup: one commit on main
fs.writeFileSync("a.txt", "aaa\n");
add("a.txt");
commit("first on main");
const mainCommit = readHead();

// Test 1: checkout -b creates a branch and switches HEAD to it (attached)
checkout("-b", "feature");
assert.strictEqual(headRaw(), "ref: refs/heads/feature", "Test 1 failed: HEAD not switched to feature (attached)");
assert.ok(fs.existsSync(path.join(".gud", "refs", "heads", "feature")), "Test 1 failed: feature ref not created");

// Test 2: committing on feature advances feature, not main
fs.writeFileSync("b.txt", "bbb\n");
add("b.txt");
commit("first on feature");
const featureCommit = readHead();
assert.notStrictEqual(featureCommit, mainCommit, "Test 2 failed: feature didn't advance");
assert.strictEqual(
  fs.readFileSync(path.join(".gud", "refs", "heads", "main"), "utf-8").trim(),
  mainCommit,
  "Test 2 failed: main should not have moved"
);

// Test 3: checkout main (existing branch) switches HEAD and restores files
checkout("main");
assert.strictEqual(headRaw(), "ref: refs/heads/main", "Test 3 failed: HEAD not switched back to main");
assert.ok(fs.existsSync("a.txt"), "Test 3 failed: a.txt should exist on main");
assert.ok(!fs.existsSync("b.txt"), "Test 3 failed: b.txt should NOT exist on main (only on feature)");

// Test 4: checkout feature again restores feature's files
checkout("feature");
assert.strictEqual(headRaw(), "ref: refs/heads/feature", "Test 4 failed: HEAD not on feature");
assert.ok(fs.existsSync("b.txt"), "Test 4 failed: b.txt should be restored on feature");

// Test 5: checkout a raw commit hash detaches HEAD
checkout(mainCommit);
assert.strictEqual(headRaw(), mainCommit, "Test 5 failed: HEAD should be detached (bare hash)");
assert.ok(fs.existsSync("a.txt"), "Test 5 failed: a.txt should be restored");
assert.ok(!fs.existsSync("b.txt"), "Test 5 failed: b.txt should not exist at mainCommit");

console.log("All checkout branch tests passed!");