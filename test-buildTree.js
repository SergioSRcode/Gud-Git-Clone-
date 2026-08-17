// test-buildTree.js
import buildTree from "./buildTree.js";
import buildDirectoryStructure from "./buildDirectoryStructure.js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import assert from "assert";

const TEST_DIR = "./test-repo-tree";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud", "objects"), { recursive: true });
  process.chdir(TEST_DIR);
}

function readObject(hash) {
  const objPath = path.join(".gud", "objects", hash.slice(0, 2), hash.slice(2));
  const compressed = fs.readFileSync(objPath);
  return zlib.inflateSync(compressed).toString("utf-8");
}

reset();

// Test 1: flat directory (no subdirectories) produces a valid tree hash
const flat = { "README.md": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391" };
const flatHash = buildTree(flat);
assert.strictEqual(flatHash.length, 40, "Test 1 failed: hash not 40 chars");
assert.match(flatHash, /^[0-9a-f]{40}$/, "Test 1 failed: not valid hex");

// Test 2: the stored object starts with "tree" header and contains the correct entry
const flatContent = readObject(flatHash);
assert.ok(flatContent.startsWith("tree "), "Test 2 failed: stored object doesn't start with 'tree'");
assert.ok(flatContent.includes("blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 README.md"), "Test 2 failed: entry line missing or malformed");

// Test 3: nested structure writes multiple tree objects, root references child
const nested = buildDirectoryStructure({
  "README.md": "aaaa",
  "src/app.js": "bbbb",
});
const nestedHash = buildTree(nested);
const rootContent = readObject(nestedHash);
// Root should contain a "tree <hash> src" line — extract that hash
const treeLineMatch = rootContent.match(/tree ([0-9a-f]{40}) src/);
assert.ok(treeLineMatch, "Test 3 failed: root tree doesn't contain a 'tree <hash> src' entry");
// That referenced child tree should also exist and contain app.js
const srcHash = treeLineMatch[1];
const srcContent = readObject(srcHash);
assert.ok(srcContent.includes("blob bbbb app.js"), "Test 3 failed: src tree doesn't contain 'blob bbbb app.js'");

// Test 4: identical directory structure produces identical hash (determinism)
const hash1 = buildTree({ "a.txt": "1111", "b.txt": "2222" });
const hash2 = buildTree({ "a.txt": "1111", "b.txt": "2222" });
assert.strictEqual(hash1, hash2, "Test 4 failed: same structure produced different hashes");

// Test 5: deeply nested structure (3 levels) works correctly
const deep = buildDirectoryStructure({
  "README.md": "aaaa",
  "src/app.js": "bbbb",
  "src/utils/math.js": "cccc",
});
const deepHash = buildTree(deep);
const deepRoot = readObject(deepHash);
const srcMatch = deepRoot.match(/tree ([0-9a-f]{40}) src/);
assert.ok(srcMatch, "Test 5 failed: root missing src tree reference");
const deepSrc = readObject(srcMatch[1]);
const utilsMatch = deepSrc.match(/tree ([0-9a-f]{40}) utils/);
assert.ok(utilsMatch, "Test 5 failed: src missing utils tree reference");
const deepUtils = readObject(utilsMatch[1]);
assert.ok(deepUtils.includes("blob cccc math.js"), "Test 5 failed: utils tree missing math.js blob entry");

console.log("All buildTree tests passed!");