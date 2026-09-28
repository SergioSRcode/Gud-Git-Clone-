// test-detached-commit.js
import commit from "./commit.js";
import checkout from "./checkout.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import { parseCommit } from "./commit.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-detached-commit";

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

// two commits on main
fs.writeFileSync("a.txt", "v1\n");
add("a.txt");
commit("first");
const first = readHead();

fs.writeFileSync("a.txt", "v2\n");
add("a.txt");
commit("second");
const second = readHead();

// Test 1: checkout the first commit → detached HEAD (bare hash)
checkout(first);
assert.strictEqual(headRaw(), first, "Test 1 failed: HEAD should be detached at first commit");

// Test 2: committing in detached HEAD advances HEAD to the NEW commit (not stuck at first)
fs.writeFileSync("a.txt", "v3 detached\n");
add("a.txt");
commit("detached commit");
const detachedTip = readHead();
assert.notStrictEqual(detachedTip, first, "Test 2 failed: detached commit did not advance HEAD");
assert.notStrictEqual(detachedTip, second, "Test 2 failed: detached tip should be a new commit");

// Test 3: HEAD is still detached (bare hash), now pointing at the new commit
assert.strictEqual(headRaw(), detachedTip, "Test 3 failed: HEAD should be detached at the new commit");
assert.ok(!headRaw().startsWith("ref:"), "Test 3 failed: HEAD should not be attached to a branch");

// Test 4: the detached commit's parent is the commit we checked out (first)
const parsed = parseCommit(detachedTip);
assert.ok(parsed.parents.includes(first), "Test 4 failed: detached commit's parent should be 'first'");

// Test 5: attached commits still work normally (regression check)
checkout("main"); // back to main (attached), which is at 'second'
assert.strictEqual(headRaw(), "ref: refs/heads/main", "Test 5 failed: should be attached to main");
fs.writeFileSync("a.txt", "v4 on main\n");
add("a.txt");
commit("third on main");
const mainTip = readHead();
assert.strictEqual(
  fs.readFileSync(path.join(".gud", "refs", "heads", "main"), "utf-8").trim(),
  mainTip,
  "Test 5 failed: attached commit should advance the branch ref"
);
assert.notStrictEqual(mainTip, second, "Test 5 failed: main should have advanced");

console.log("All detached-commit tests passed!");