// test-mergeBase.js
import { findMergeBase } from "./merge.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import checkout from "./checkout.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-mergebase";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// Build: O <- A <- B on main, and O <- D on feature (branched at O)
fs.writeFileSync("f.txt", "O\n");
add("f.txt");
commit("O");
const O = readHead();

// branch feature at O
checkout("-b", "feature");
fs.writeFileSync("g.txt", "D\n");
add("g.txt");
commit("D");
const D = readHead();

// back to main, add A, B
checkout("main");
fs.writeFileSync("f.txt", "A\n");
add("f.txt");
commit("A");
const A = readHead();
fs.writeFileSync("f.txt", "B\n");
add("f.txt");
commit("B");
const B = readHead();

// Test 1: merge base of B (main tip) and D (feature tip) is O
assert.strictEqual(findMergeBase(B, D), O, "Test 1 failed: merge base should be O");

// Test 2: merge base is symmetric (order of args doesn't matter)
assert.strictEqual(findMergeBase(D, B), O, "Test 2 failed: merge base should be symmetric");

// Test 3: a commit is its own merge base with itself
assert.strictEqual(findMergeBase(B, B), B, "Test 3 failed: merge base of a commit with itself is itself");

// Test 4: if A is an ancestor of B, merge base is A
assert.strictEqual(findMergeBase(A, B), A, "Test 4 failed: ancestor's merge base should be the ancestor itself");

// Test 5: merge base of O and B is O (O is ancestor of B)
assert.strictEqual(findMergeBase(O, B), O, "Test 5 failed: merge base of ancestor and descendant should be the ancestor");

console.log("All merge base tests passed!");