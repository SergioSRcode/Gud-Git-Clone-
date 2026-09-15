// test-multiparent-commit.js
import commit from "./commit.js";
import { parseCommit, createCommitContent } from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-multiparent";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

reset();

// Test 1: first commit (no parents) still works and parses to empty parents array
fs.writeFileSync("a.txt", "a\n");
add("a.txt");
commit("first");
const first = readHead();
const firstParsed = parseCommit(first);
assert.ok(Array.isArray(firstParsed.parents), "Test 1 failed: parents should be an array");
assert.strictEqual(firstParsed.parents.length, 0, "Test 1 failed: first commit should have 0 parents");

// Test 2: second commit has exactly one parent (the first)
fs.writeFileSync("a.txt", "a2\n");
add("a.txt");
commit("second");
const second = readHead();
const secondParsed = parseCommit(second);
assert.strictEqual(secondParsed.parents.length, 1, "Test 2 failed: should have 1 parent");
assert.strictEqual(secondParsed.parents[0], first, "Test 2 failed: parent should be the first commit");

// Test 3: createCommitContent with two parents writes two parent lines
const content = createCommitContent("treehash1234567890123456789012345678901234", ["parentAAA1234567890123456789012345678901234", "parentBBB1234567890123456789012345678901234"], "merge msg");
const parentLines = content.split("\n").filter(l => l.startsWith("parent "));
assert.strictEqual(parentLines.length, 2, "Test 3 failed: should have exactly 2 parent lines");

// Test 4: createCommitContent with empty parents writes no parent line
const content2 = createCommitContent("treehash1234567890123456789012345678901234", [], "first msg");
assert.ok(!content2.includes("parent "), "Test 4 failed: empty parents should produce no parent line");

// Test 5: a manually-built two-parent commit parses back to two parents
import { storeObject } from "./writeObject.js";
// build a fake commit object with two parents via createCommitContent + serialize
// (reuse your serializer — adjust import/name to match your code)
import { serializeContentStringToCommitObject } from "./commit.js";
const twoParentContent = createCommitContent(
  "treehash1234567890123456789012345678901234",
  ["aaaa111122223333444455556666777788889999", "bbbb111122223333444455556666777788889999"],
  "merge"
);
const buf = serializeContentStringToCommitObject(twoParentContent);
const mergeHash = storeObject(buf);
const parsedMerge = parseCommit(mergeHash);
assert.strictEqual(parsedMerge.parents.length, 2, "Test 5 failed: two-parent commit should parse to 2 parents");
assert.ok(parsedMerge.parents.includes("aaaa111122223333444455556666777788889999"), "Test 5 failed: first parent missing");
assert.ok(parsedMerge.parents.includes("bbbb111122223333444455556666777788889999"), "Test 5 failed: second parent missing");

console.log("All multi-parent commit tests passed!");