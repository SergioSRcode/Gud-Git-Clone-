// test-checkout.js
import checkout from "./checkout.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-checkout";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// Setup: create a commit with a root file and a nested file
fs.writeFileSync("README.md", "readme content\n");
fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "app.js"), "console.log('v1');\n");
add("README.md");
add("src/app.js");
commit("initial commit");
const firstCommit = readHead();

// Now change the working directory: modify a file, delete another
fs.writeFileSync("README.md", "COMPLETELY DIFFERENT\n");
fs.rmSync(path.join("src", "app.js"));

// Test 1: checkout restores a modified root file to its committed content
checkout(firstCommit);
assert.strictEqual(fs.readFileSync("README.md", "utf-8"), "readme content\n", "Test 1 failed: root file not restored");

// Test 2: checkout restores a deleted nested file (and its directory)
assert.ok(fs.existsSync(path.join("src", "app.js")), "Test 2 failed: nested file not restored");
assert.strictEqual(fs.readFileSync(path.join("src", "app.js"), "utf-8"), "console.log('v1');\n", "Test 2 failed: nested file content wrong");

// Test 3: checkout a later commit reflects its changes
fs.writeFileSync("README.md", "readme v2\n");
add("README.md");
commit("second commit");
const secondCommit = readHead();
// go back to first
checkout(firstCommit);
assert.strictEqual(fs.readFileSync("README.md", "utf-8"), "readme content\n", "Test 3 failed: didn't restore to first commit state");
// forward to second
checkout(secondCommit);
assert.strictEqual(fs.readFileSync("README.md", "utf-8"), "readme v2\n", "Test 3 failed: didn't restore to second commit state");

// Test 4: deeply nested structure is restored correctly
fs.mkdirSync(path.join("src", "utils"), { recursive: true });
fs.writeFileSync(path.join("src", "utils", "math.js"), "export const add = (a,b) => a+b;\n");
add("src/utils/math.js");
commit("add nested util");
const thirdCommit = readHead();
fs.rmSync("src", { recursive: true, force: true });
checkout(thirdCommit);
assert.ok(fs.existsSync(path.join("src", "utils", "math.js")), "Test 4 failed: deeply nested file not restored");
assert.strictEqual(fs.readFileSync(path.join("src", "utils", "math.js"), "utf-8"), "export const add = (a,b) => a+b;\n", "Test 4 failed: nested content wrong");

// Test 5: checkout doesn't corrupt binary-ish content (bytes preserved)
const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x10, 0x00]);
fs.writeFileSync("data.bin", bytes);
add("data.bin");
commit("add binary");
const binCommit = readHead();
fs.rmSync("data.bin");
checkout(binCommit);
const restored = fs.readFileSync("data.bin");
assert.ok(restored.equals(bytes), "Test 5 failed: binary content not preserved byte-for-byte");

console.log("All checkout tests passed!");