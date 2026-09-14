// test-flattenTree.js
import { flattenTree } from "./merge.js";
import { parseCommit } from "./commit.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-flatten";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// commit a root file and nested files
fs.writeFileSync("README.md", "readme\n");
fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "app.js"), "app\n");
fs.mkdirSync(path.join("src", "utils"), { recursive: true });
fs.writeFileSync(path.join("src", "utils", "math.js"), "math\n");
add("README.md");
add("src/app.js");
add("src/utils/math.js");
commit("initial");

const treeHash = parseCommit(readHead()).tree;
const flat = flattenTree(treeHash);

// Test 1: root file present with correct key
assert.ok("README.md" in flat, "Test 1 failed: README.md missing from flattened tree");

// Test 2: nested file uses forward-slash relative path
assert.ok("src/app.js" in flat, "Test 2 failed: src/app.js missing or wrong key");

// Test 3: deeply nested file present with full path
assert.ok("src/utils/math.js" in flat, "Test 3 failed: src/utils/math.js missing");

// Test 4: values are 40-char blob hashes
for (const [p, h] of Object.entries(flat)) {
  assert.match(h, /^[0-9a-f]{40}$/, `Test 4 failed: value for ${p} is not a valid hash`);
}

// Test 5: exactly the three committed files, nothing extra (no directory entries)
assert.strictEqual(Object.keys(flat).length, 3, "Test 5 failed: expected exactly 3 file entries");

console.log("All flattenTree tests passed!");