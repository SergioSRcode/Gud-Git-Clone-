// test-merge-ff.js
import merge from "./merge.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import checkout from "./checkout.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-merge-ff";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

function mainTip() {
  return fs.readFileSync(path.join(".gud", "refs", "heads", "main"), "utf-8").trim();
}

reset();

// main: O. feature branches at O and adds D, E. main stays at O.
fs.writeFileSync("f.txt", "O\n");
add("f.txt");
commit("O");
const O = readHead();

checkout("-b", "feature");
fs.writeFileSync("g.txt", "D\n");
add("g.txt");
commit("D");
fs.writeFileSync("g.txt", "E\n");
add("g.txt");
commit("E");
const E = readHead();

// back to main (still at O)
checkout("main");
assert.strictEqual(readHead(), O, "setup check: main should be at O");

// Test 1: fast-forward merge moves main to feature's tip (E)
merge("feature");
assert.strictEqual(mainTip(), E, "Test 1 failed: main should fast-forward to E");

// Test 2: working directory reflects feature's tip after fast-forward
assert.ok(fs.existsSync("g.txt"), "Test 2 failed: g.txt from feature should exist after ff merge");
assert.strictEqual(fs.readFileSync("g.txt", "utf-8"), "E\n", "Test 2 failed: g.txt content should be E");

// Test 3: merging a branch that's already an ancestor = already up to date (no ref change)
const beforeHash = mainTip();
merge("feature"); // feature is now an ancestor of main (they're equal)
assert.strictEqual(mainTip(), beforeHash, "Test 3 failed: already-up-to-date merge should not move ref");

// Test 4: merging a non-existent branch is handled gracefully
const beforeHash2 = mainTip();
merge("nonexistent");
assert.strictEqual(mainTip(), beforeHash2, "Test 4 failed: merging nonexistent branch should not move ref");

// Test 5: divergent branches do NOT fast-forward (ref unchanged, three-way not yet done)
reset();
fs.writeFileSync("f.txt", "O\n");
add("f.txt");
commit("O2");
const O2 = readHead();
checkout("-b", "feat2");
fs.writeFileSync("h.txt", "feat\n");
add("h.txt");
commit("feat commit");
checkout("main");
fs.writeFileSync("f.txt", "main change\n");
add("f.txt");
commit("main commit");
const mainDiverged = mainTip();
merge("feat2"); // divergent — should NOT fast-forward
assert.strictEqual(mainTip(), mainDiverged, "Test 5 failed: divergent merge should not fast-forward main");

console.log("All fast-forward merge tests passed!");