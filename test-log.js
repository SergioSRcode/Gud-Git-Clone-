// test-log.js
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readObject from "./readObject.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-log";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// Test 1: readObject returns decompressed content with header stripped
fs.writeFileSync("a.txt", "content A\n");
add("a.txt");
commit("commit one");
const headHash = readHead();
const content = readObject(headHash).toString("utf-8");
assert.ok(!content.includes("\0"), "Test 1 failed: header/null byte not stripped");
assert.ok(content.startsWith("tree "), "Test 1 failed: content should start with tree line");

// Test 2: readObject on a blob returns the original file content
const treeLine = content.split("\n").find(l => l.startsWith("tree "));
const treeHash = treeLine.split(" ")[1];
const treeContent = readObject(treeHash).toString("utf-8");
const blobLine = treeContent.split("\n").find(l => l.includes("a.txt"));
const blobHash = blobLine.split(" ")[1];
const blobContent = readObject(blobHash).toString("utf-8");
assert.strictEqual(blobContent, "content A\n", "Test 2 failed: blob content mismatch");

// Test 3: log doesn't crash and (visually) prints something — we capture console output
fs.writeFileSync("a.txt", "content A v2\n");
add("a.txt");
commit("commit two");

import log from "./log.js";
let captured = [];
const origLog = console.log;
console.log = (...args) => captured.push(args.join(" "));
log();
console.log = origLog;
const output = captured.join("\n");
assert.ok(output.includes("commit one"), "Test 3 failed: log missing first commit message");
assert.ok(output.includes("commit two"), "Test 3 failed: log missing second commit message");

// Test 4: log prints commits in reverse-chronological order (newest first)
const posTwo = output.indexOf("commit two");
const posOne = output.indexOf("commit one");
assert.ok(posTwo < posOne, "Test 4 failed: commits not in newest-first order");

// Test 5: log on a fresh repo with no commits doesn't crash
reset();
captured = [];
console.log = (...args) => captured.push(args.join(" "));
log();
console.log = origLog;
assert.ok(captured.join("\n").length >= 0, "Test 5 failed: log crashed on empty repo");

console.log("All log tests passed!");