// test-createBranch.js
import createBranch from "./createBranch.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-createbranch";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// Test 1: creating a branch writes a ref file pointing at the current commit
fs.writeFileSync("a.txt", "aaa\n");
add("a.txt");
commit("first");
const currentCommit = readHead();
createBranch("feature");
const branchFile = path.join(".gud", "refs", "heads", "feature");
assert.ok(fs.existsSync(branchFile), "Test 1 failed: branch ref file not created");
assert.strictEqual(fs.readFileSync(branchFile, "utf-8").trim(), currentCommit, "Test 1 failed: branch doesn't point at current commit");

// Test 2: creating a branch does NOT switch HEAD (still on main)
const headContent = fs.readFileSync(path.join(".gud", "HEAD"), "utf-8");
assert.ok(headContent.includes("refs/heads/main"), "Test 2 failed: HEAD should still be on main after createBranch");

// Test 3: the new branch and main point at the same commit initially
const mainFile = path.join(".gud", "refs", "heads", "main");
assert.strictEqual(
  fs.readFileSync(branchFile, "utf-8").trim(),
  fs.readFileSync(mainFile, "utf-8").trim(),
  "Test 3 failed: new branch and main should point at the same commit"
);

// Test 4: creating a branch before any commit is handled gracefully (no crash, no bogus ref)
reset();
createBranch("early");
assert.ok(!fs.existsSync(path.join(".gud", "refs", "heads", "early")), "Test 4 failed: should not create a branch with no commits");

// Test 5: creating a branch that already exists doesn't silently clobber a different commit
reset();
fs.writeFileSync("a.txt", "aaa\n");
add("a.txt");
commit("first");
createBranch("dup");
const firstDupTarget = fs.readFileSync(path.join(".gud", "refs", "heads", "dup"), "utf-8").trim();
fs.writeFileSync("a.txt", "bbb\n");
add("a.txt");
commit("second");
createBranch("dup"); // should refuse or no-op, not repoint to the new commit
const secondDupTarget = fs.readFileSync(path.join(".gud", "refs", "heads", "dup"), "utf-8").trim();
assert.strictEqual(firstDupTarget, secondDupTarget, "Test 5 failed: existing branch should not be repointed by a duplicate createBranch");

console.log("All createBranch tests passed!");