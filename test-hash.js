import hashObject from "./hashObject.js";
import { buildBlob } from "./buildBlob.js";
import assert from "assert";

// Test 1: known SHA-1 for blob of "hello world\n" content
const blob1 = buildBlob(Buffer.from("hello world\n"));
assert.strictEqual(hashObject(blob1), "3b18e512dba79e4c8300dd08aeb37f8e728b8dad", "Test 1 failed");

// Test 2: empty content still produces a valid, deterministic hash
const blob2 = buildBlob(Buffer.from(""));
assert.strictEqual(hashObject(blob2), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", "Test 2 failed");

// Test 3: hash is always 40 hex characters
const blob3 = buildBlob(Buffer.from("some random content"));
const result3 = hashObject(blob3);
assert.strictEqual(result3.length, 40, "Test 3 failed: wrong hash length");
assert.match(result3, /^[0-9a-f]{40}$/, "Test 3 failed: not valid hex");

// Test 4: identical blobs produce identical hash (determinism)
const a = hashObject(buildBlob(Buffer.from("identical content")));
const b = hashObject(buildBlob(Buffer.from("identical content")));
assert.strictEqual(a, b, "Test 4 failed: hash not deterministic");

// Test 5: different content produces different hash
const c = hashObject(buildBlob(Buffer.from("content A")));
const d = hashObject(buildBlob(Buffer.from("content B")));
assert.notStrictEqual(c, d, "Test 5 failed: different content collided");

console.log("All hashObject tests passed!");