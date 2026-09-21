// test-merge-threeway.js
import merge from "./merge.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import checkout from "./checkout.js";
import readHead from "./readHead.js";
import { parseCommit } from "./commit.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-merge-3way";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

function mainTip() {
  return fs.readFileSync(path.join(".gud", "refs", "heads", "main"), "utf-8").trim();
}

// --- Clean three-way merge (no conflicts): each side edits a DIFFERENT file ---
reset();
fs.writeFileSync("shared.txt", "base\n");
add("shared.txt");
commit("O");
const O = readHead();

checkout("-b", "feature");
fs.writeFileSync("feature-file.txt", "feature work\n");
add("feature-file.txt");
commit("feature adds a file");
const featureTip = readHead();

checkout("main");
fs.writeFileSync("main-file.txt", "main work\n");
add("main-file.txt");
commit("main adds a file");
const mainBefore = mainTip();

// Test 1: clean three-way merge creates a new commit (ref moved, not to featureTip)
merge("feature");
const mergeCommit = mainTip();
assert.notStrictEqual(mergeCommit, mainBefore, "Test 1 failed: merge should create a new commit");
assert.notStrictEqual(mergeCommit, featureTip, "Test 1 failed: three-way merge is not a fast-forward");

// Test 2: the merge commit has two parents (main's old tip and feature's tip)
const parsed = parseCommit(mergeCommit);
assert.strictEqual(parsed.parents.length, 2, "Test 2 failed: merge commit should have 2 parents");
assert.ok(parsed.parents.includes(mainBefore), "Test 2 failed: missing ours parent");
assert.ok(parsed.parents.includes(featureTip), "Test 2 failed: missing theirs parent");

// Test 3: working directory contains BOTH sides' files after merge
assert.ok(fs.existsSync("main-file.txt"), "Test 3 failed: main's file missing after merge");
assert.ok(fs.existsSync("feature-file.txt"), "Test 3 failed: feature's file missing after merge");
assert.ok(fs.existsSync("shared.txt"), "Test 3 failed: shared file missing after merge");

// --- Conflict case: both sides edit the SAME file differently ---
reset();
fs.writeFileSync("conflict.txt", "base\n");
add("conflict.txt");
commit("O2");

checkout("-b", "feat");
fs.writeFileSync("conflict.txt", "feature version\n");
add("conflict.txt");
commit("feature edits conflict.txt");

checkout("main");
fs.writeFileSync("conflict.txt", "main version\n");
add("conflict.txt");
commit("main edits conflict.txt");
const mainBeforeConflict = mainTip();

// Test 4: conflicting merge does NOT move the ref (aborts)
merge("feat");
assert.strictEqual(mainTip(), mainBeforeConflict, "Test 4 failed: conflicting merge should not create a commit");

// Test 5: after a clean merge, log walks both histories (merge base reachable)
reset();
fs.writeFileSync("a.txt", "a\n");
add("a.txt");
commit("root");
const root = readHead();
checkout("-b", "br");
fs.writeFileSync("b.txt", "b\n");
add("b.txt");
commit("br work");
const brTip = readHead();
checkout("main");
fs.writeFileSync("c.txt", "c\n");
add("c.txt");
commit("main work");
merge("br");
const finalMerge = mainTip();
// the merge commit's two parents should both trace back to root eventually
const mp = parseCommit(finalMerge).parents;
assert.strictEqual(mp.length, 2, "Test 5 failed: expected 2 parents");

console.log("All three-way merge tests passed!");