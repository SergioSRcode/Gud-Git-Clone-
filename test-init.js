// test-init.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo";
const GUD_CMD = "node ../gud.js";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR);
}

function run(cmd) {
  execSync(cmd, { cwd: TEST_DIR });
}

// Test 1: .gud directory is created
reset();
run(`${GUD_CMD} init`);
assert.ok(fs.existsSync(path.join(TEST_DIR, ".gud")), "Test 1 failed: .gud not created");

// Test 2: objects directory exists and is empty
assert.ok(fs.existsSync(path.join(TEST_DIR, ".gud/objects")), "Test 2 failed: objects/ missing");
assert.strictEqual(fs.readdirSync(path.join(TEST_DIR, ".gud/objects")).length, 0, "Test 2 failed: objects/ not empty");

// Test 3: refs/heads directory exists
assert.ok(fs.existsSync(path.join(TEST_DIR, ".gud/refs/heads")), "Test 3 failed: refs/heads missing");

// Test 4: HEAD file exists with correct content
const head = fs.readFileSync(path.join(TEST_DIR, ".gud/HEAD"), "utf-8");
assert.strictEqual(head, "ref: refs/heads/main\n", "Test 4 failed: HEAD content wrong");

// Test 5: running init again doesn't crash
try {
  run(`${GUD_CMD} init`);
  console.log("Test 5 passed: re-running init did not crash");
} catch (e) {
  console.error("Test 5 failed: re-running init threw an error", e);
}

console.log("All init tests completed.");