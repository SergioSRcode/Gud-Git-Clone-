// test-add.js
import add from "./add.js"; 
import readIndex from "./readIndex.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-add";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud", "objects"), { recursive: true });
  process.chdir(TEST_DIR);
}

reset();

// Test 1: adding a file stores its content in the object database under the correct hash
fs.writeFileSync("hello.txt", "hello world\n");
add("hello.txt");
const expectedHash = "3b18e512dba79e4c8300dd08aeb37f8e728b8dad";
const objPath = path.join(".gud", "objects", expectedHash.slice(0, 2), expectedHash.slice(2));
assert.ok(fs.existsSync(objPath), "Test 1 failed: object not written for added file");

// Test 2: adding a file updates the index with the correct path -> hash mapping
const index2 = readIndex();
assert.strictEqual(index2["hello.txt"], expectedHash, "Test 2 failed: index not updated correctly");

// Test 3: adding a second, different file adds a new entry without removing the first
fs.writeFileSync("README.md", "");
add("README.md");
const index3 = readIndex();
assert.strictEqual(Object.keys(index3).length, 2, "Test 3 failed: expected 2 entries in index");
assert.strictEqual(index3["hello.txt"], expectedHash, "Test 3 failed: first entry lost after second add");
assert.strictEqual(index3["README.md"], "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", "Test 3 failed: second entry hash wrong");

// Test 4: re-adding a file after modifying it updates its hash in place (no duplicate entries)
fs.writeFileSync("hello.txt", "hello world modified\n");
add("hello.txt");
const index4 = readIndex();
assert.strictEqual(Object.keys(index4).length, 2, "Test 4 failed: expected still only 2 entries after re-adding modified file");
assert.notStrictEqual(index4["hello.txt"], expectedHash, "Test 4 failed: hash should have changed after modifying file");

// Test 5: adding a file inside a subdirectory stores it with a relative path
fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "app.js"), "console.log('hi');\n");
add("src/app.js");
const index5 = readIndex();
assert.ok("src/app.js" in index5, "Test 5 failed: subdirectory file not stored with expected relative path key");

console.log("All add tests passed!");