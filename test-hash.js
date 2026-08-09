// test-hash.js
import hashContent from "./hashContent.js";
import assert from "assert";

// Test 1: known SHA-1 for blob of "hello world\n" content
const result1 = hashContent(Buffer.from("hello world\n"));
assert.strictEqual(result1, "3b18e512dba79e4c8300dd08aeb37f8e728b8dad", "Test 1 failed");

// Test 2: empty content still produces a valid, deterministic hash
const result2 = hashContent(Buffer.from(""));
assert.strictEqual(result2, "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", "Test 2 failed");

// Test 3: hash is always 40 hex characters
const result3 = hashContent(Buffer.from("some random content"));
assert.strictEqual(result3.length, 40, "Test 3 failed: wrong hash length");
assert.match(result3, /^[0-9a-f]{40}$/, "Test 3 failed: not valid hex");

// Test 4: identical content produces identical hash (determinism)
const a = hashContent(Buffer.from("identical content"));
const b = hashContent(Buffer.from("identical content"));
assert.strictEqual(a, b, "Test 4 failed: hash not deterministic");

// Test 5: different content produces different hash
const c = hashContent(Buffer.from("content A"));
const d = hashContent(Buffer.from("content B"));
assert.notStrictEqual(c, d, "Test 5 failed: different content collided");

console.log("All hashContent tests passed!");