// test-commit.js
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import assert from "assert";

const TEST_DIR = "./test-repo-commit";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

function readObject(hash) {
  const objPath = path.join(".gud", "objects", hash.slice(0, 2), hash.slice(2));
  return zlib.inflateSync(fs.readFileSync(objPath)).toString("utf-8");
}

reset();

// Test 1: first commit creates a commit object and advances the ref
fs.writeFileSync("hello.txt", "hello world\n");
add("hello.txt");
commit("first commit");
const firstHash = readHead();
assert.ok(firstHash && firstHash.length === 40, "Test 1 failed: ref not advanced to a commit hash");

// Test 2: commit object has correct structure (tree line, author, message, NO parent)
const firstContent = readObject(firstHash);
assert.ok(firstContent.startsWith("commit "), "Test 2 failed: object is not a commit type");
assert.ok(/tree [0-9a-f]{40}/.test(firstContent), "Test 2 failed: missing tree line");
assert.ok(firstContent.includes("first commit"), "Test 2 failed: missing commit message");
assert.ok(!firstContent.includes("parent "), "Test 2 failed: first commit should have no parent line");

// Test 3: second commit has a parent line pointing at the first commit
fs.writeFileSync("hello.txt", "hello world v2\n");
add("hello.txt");
commit("second commit");
const secondHash = readHead();
assert.notStrictEqual(secondHash, firstHash, "Test 3 failed: ref didn't advance to new commit");
const secondContent = readObject(secondHash);
assert.ok(secondContent.includes("parent " + firstHash), "Test 3 failed: second commit doesn't reference first as parent");

// Test 4: the tree hash in the commit actually points to a stored tree object
const treeMatch = secondContent.match(/tree ([0-9a-f]{40})/);
assert.ok(treeMatch, "Test 4 failed: no tree line found");
const treeContent = readObject(treeMatch[1]);
assert.ok(treeContent.startsWith("tree "), "Test 4 failed: referenced tree object not found or wrong type");
assert.ok(treeContent.includes("hello.txt"), "Test 4 failed: tree doesn't contain committed file");

// Test 5: committing with an empty index doesn't crash / doesn't create a bogus commit
// (reset index by committing then clearing)
import writeIndex from "./writeIndex.js";
writeIndex({});
const beforeHash = readHead();
commit("empty commit attempt");
const afterHash = readHead();
assert.strictEqual(afterHash, beforeHash, "Test 5 failed: empty commit should not advance the ref");

console.log("All commit tests passed!");