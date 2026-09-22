// test-push.js
import push from "./push.js"; // or wherever you put it
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT = process.cwd();
const LOCAL = path.join(ROOT, "test-push-local");
const REMOTE = path.join(ROOT, "test-push-remote");

function resetBoth() {
  fs.rmSync(LOCAL, { recursive: true, force: true });
  fs.rmSync(REMOTE, { recursive: true, force: true });
  fs.mkdirSync(LOCAL, { recursive: true });
  fs.mkdirSync(REMOTE, { recursive: true });
  // init the remote as a bare-ish repo (just needs .gud structure)
  process.chdir(REMOTE);
  init();
  process.chdir(LOCAL);
  init();
}

resetBoth();

// make a commit locally
fs.writeFileSync("a.txt", "aaa\n");
add("a.txt");
commit("first");
const localTip = readHead();

// Test 1: push copies objects to the remote and sets its ref
push(REMOTE, "main");
const remoteRef = fs.readFileSync(path.join(REMOTE, ".gud", "refs", "heads", "main"), "utf-8").trim();
assert.strictEqual(remoteRef, localTip, "Test 1 failed: remote ref not updated to local tip");

// Test 2: the commit object exists in the remote's object store
const objRelPath = path.join(".gud", "objects", localTip.slice(0, 2), localTip.slice(2));
assert.ok(fs.existsSync(path.join(REMOTE, objRelPath)), "Test 2 failed: commit object not copied to remote");

// Test 3: pushing again (no new commits) is a no-op that doesn't crash
push(REMOTE, "main");
const remoteRef2 = fs.readFileSync(path.join(REMOTE, ".gud", "refs", "heads", "main"), "utf-8").trim();
assert.strictEqual(remoteRef2, localTip, "Test 3 failed: idempotent push changed the ref unexpectedly");

// Test 4: a second commit pushes only the new objects and advances the remote ref
fs.writeFileSync("a.txt", "aaa v2\n");
add("a.txt");
commit("second");
const localTip2 = readHead();
push(REMOTE, "main");
const remoteRef3 = fs.readFileSync(path.join(REMOTE, ".gud", "refs", "heads", "main"), "utf-8").trim();
assert.strictEqual(remoteRef3, localTip2, "Test 4 failed: remote ref not advanced after second push");

// Stronger Test 5: remote objects are VALID (decompressable + correct content),
// not merely present at the right path.
import zlib from "zlib";

// Helper: read an object's decompressed, header-stripped content from a given .gud/objects dir
function readObjectFrom(gudObjectsDir, hash) {
  const objPath = path.join(gudObjectsDir, hash.slice(0, 2), hash.slice(2));
  const compressed = fs.readFileSync(objPath);           // raw compressed bytes
  const inflated = zlib.inflateSync(compressed);         // will THROW if the file isn't valid zlib
  const nullIdx = inflated.indexOf(0);                   // strip "<type> <size>\0" header
  return inflated.subarray(nullIdx + 1);                 // content as Buffer
}

const localObjectsDir = path.join(LOCAL, ".gud", "objects");
const remoteObjectsDir = path.join(REMOTE, ".gud", "objects");

// 5a: the remote commit object decompresses without throwing (proves it's real compressed data, not a hash string)
let remoteCommitContent;
try {
  remoteCommitContent = readObjectFrom(remoteObjectsDir, localTip2);
} catch (e) {
  assert.fail("Test 5a failed: remote commit object is not valid zlib data (corrupt copy) — " + e.message);
}

// 5b: the remote commit's content byte-for-byte matches the local commit's content
const localCommitContent = readObjectFrom(localObjectsDir, localTip2);
assert.ok(
  remoteCommitContent.equals(localCommitContent),
  "Test 5b failed: remote commit content does not match local — objects were copied incorrectly"
);

// 5c: the remote commit's tree object is ALSO valid on the remote (walk one level deeper)
//     parse the commit content to find its tree hash, then verify that tree object on the remote
const commitText = localCommitContent.toString("utf-8");
const treeHash = commitText.split("\n").find(l => l.startsWith("tree ")).split(" ")[1];
let remoteTreeContent;
try {
  remoteTreeContent = readObjectFrom(remoteObjectsDir, treeHash);
} catch (e) {
  assert.fail("Test 5c failed: remote TREE object is not valid zlib data — " + e.message);
}
const localTreeContent = readObjectFrom(localObjectsDir, treeHash);
assert.ok(
  remoteTreeContent.equals(localTreeContent),
  "Test 5c failed: remote tree content does not match local"
);

// 5d: every reachable blob referenced by that tree is present AND valid on the remote
//     (proves blobs, not just commits/trees, were copied correctly)
const treeText = remoteTreeContent.toString("utf-8");
treeText.split("\n").filter(Boolean).forEach(line => {
  const [type, hash] = line.split(" ");
  if (type === "blob") {
    let remoteBlob, localBlob;
    try {
      remoteBlob = readObjectFrom(remoteObjectsDir, hash);
    } catch (e) {
      assert.fail(`Test 5d failed: remote blob ${hash} is not valid zlib data — ${e.message}`);
    }
    localBlob = readObjectFrom(localObjectsDir, hash);
    assert.ok(remoteBlob.equals(localBlob), `Test 5d failed: remote blob ${hash} content mismatch`);
  }
});

console.log("Stronger object-validity assertions passed!");

console.log("All push tests passed!");