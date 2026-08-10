// test-writeObject.js
import writeObject from "./writeObject.js"; // adjust import to match your setup
import fs from "fs";
import path from "path";
import zlib from "zlib";
import assert from "assert";

const TEST_DIR = "./test-repo-writeobject";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, ".gud", "objects"), { recursive: true });
}

reset();
process.chdir(TEST_DIR); // so relative .gud/objects paths resolve here

// Test 1: returns the correct known hash
const hash1 = writeObject(Buffer.from("hello world\n"));
assert.strictEqual(hash1, "3b18e512dba79e4c8300dd08aeb37f8e728b8dad", "Test 1 failed: wrong hash returned");

// Test 2: file was actually written at the correct path
const objPath = path.join(".gud", "objects", hash1.slice(0, 2), hash1.slice(2));
assert.ok(fs.existsSync(objPath), "Test 2 failed: object file not written to expected path");

// Test 3: file content, when decompressed, matches the original blob exactly
const compressed = fs.readFileSync(objPath);
const decompressed = zlib.inflateSync(compressed);
const expectedBlob = Buffer.concat([
  Buffer.from("blob 12\0"),
  Buffer.from("hello world\n"),
]);
assert.ok(decompressed.equals(expectedBlob), "Test 3 failed: decompressed content doesn't match expected blob");

// Test 4: writing identical content twice produces the same hash and doesn't throw
const hashA = writeObject(Buffer.from("duplicate content"));
const hashB = writeObject(Buffer.from("duplicate content"));
assert.strictEqual(hashA, hashB, "Test 4 failed: identical content produced different hashes");

// Test 5: writing empty content works and produces the known empty-blob hash
const hashEmpty = writeObject(Buffer.from(""));
assert.strictEqual(hashEmpty, "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", "Test 5 failed: empty content hash mismatch");

console.log("All writeObject tests passed!");