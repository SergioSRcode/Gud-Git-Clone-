// test-checkout-emptydirs.js
import checkout from "./checkout.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const TEST_DIR = "./test-repo-checkout-emptydirs";

function reset() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  init();
}

// Test 1: a directory whose only file is removed gets pruned
reset();
fs.writeFileSync("root.txt", "root\n");
add("root.txt");
commit("only root");
const rootOnly = readHead();

fs.mkdirSync("src", { recursive: true });
fs.writeFileSync(path.join("src", "app.js"), "app\n");
add("src/app.js");
commit("adds src/app.js");
const withSrc = readHead();

// currently at withSrc → go back to rootOnly. src/app.js is deleted; src/ should be pruned.
checkout(rootOnly);
assert.ok(!fs.existsSync(path.join("src", "app.js")), "Test 1 failed: src/app.js should be deleted");
assert.ok(!fs.existsSync("src"), "Test 1 failed: empty src/ directory should be pruned");

// Test 2: nested empty dirs are pruned all the way up
reset();
fs.writeFileSync("root.txt", "root\n");
add("root.txt");
commit("only root");
const base = readHead();

fs.mkdirSync(path.join("a", "b", "c"), { recursive: true });
fs.writeFileSync(path.join("a", "b", "c", "deep.txt"), "deep\n");
add("a/b/c/deep.txt");
commit("adds deeply nested file");
const withDeep = readHead();

checkout(base);
assert.ok(!fs.existsSync(path.join("a", "b", "c", "deep.txt")), "Test 2 failed: deep.txt should be deleted");
assert.ok(!fs.existsSync("a"), "Test 2 failed: entire empty a/b/c chain should be pruned");

// Test 3: a directory that still contains an UNTRACKED file is NOT pruned
reset();
fs.writeFileSync("root.txt", "root\n");
add("root.txt");
commit("only root");
const clean = readHead();

fs.mkdirSync("logs", { recursive: true });
fs.writeFileSync(path.join("logs", "tracked.txt"), "tracked\n");
add("logs/tracked.txt");
commit("adds logs/tracked.txt");
const withLogs = readHead();

// user drops an untracked file into logs/
fs.writeFileSync(path.join("logs", "untracked.log"), "keep me\n");

// checkout back to clean → logs/tracked.txt deleted, but logs/ still has untracked.log
checkout(clean);
assert.ok(!fs.existsSync(path.join("logs", "tracked.txt")), "Test 3 failed: tracked.txt should be deleted");
assert.ok(fs.existsSync("logs"), "Test 3 failed: logs/ must NOT be pruned — it still holds an untracked file");
assert.ok(fs.existsSync(path.join("logs", "untracked.log")), "Test 3 failed: untracked.log must survive");

// Test 4: a directory that still has a tracked SIBLING file is not pruned
// reset();
// fs.mkdirSync("src", { recursive: true });
// fs.writeFileSync(path.join("src", "keep.js"), "keep\n");
// fs.writeFileSync(path.join("src", "remove.js"), "remove\n");
// add("src/keep.js");
// add("src/remove.js");
// commit("src has two files");
// const twoFiles = readHead();

// // new commit removes only remove.js
// fs.rmSync(path.join("src", "remove.js"));
// // re-stage the current state: keep.js stays, remove.js gone
// // (simplest: add keep.js again so index reflects only keep.js — depends on your add semantics)
// add("src/keep.js");
// // Note: to truly drop remove.js from the tree you'd need index removal; if your tool
// // lacks that, emulate by committing a state where src still has keep.js.
// commit("src now has only keep.js");
// const oneFile = readHead();

// checkout(twoFiles); // restores remove.js
// assert.ok(fs.existsSync(path.join("src", "remove.js")), "Test 4 failed: remove.js should be restored");
// checkout(oneFile);  // remove.js deleted, but keep.js remains → src/ must survive
// assert.ok(!fs.existsSync(path.join("src", "remove.js")), "Test 4 failed: remove.js should be deleted");
// assert.ok(fs.existsSync(path.join("src", "keep.js")), "Test 4 failed: keep.js must remain");
// assert.ok(fs.existsSync("src"), "Test 4 failed: src/ must NOT be pruned — keep.js is still there");

// Test 5: pruning does not touch the repo root or .gud
reset();
fs.writeFileSync("root.txt", "root\n");
add("root.txt");
commit("c1");
const c1 = readHead();

fs.mkdirSync("temp", { recursive: true });
fs.writeFileSync(path.join("temp", "x.txt"), "x\n");
add("temp/x.txt");
commit("c2");
const c2 = readHead();

checkout(c1); // temp/ should be pruned
assert.ok(!fs.existsSync("temp"), "Test 5 failed: temp/ should be pruned");
assert.ok(fs.existsSync(".gud"), "Test 5 failed: .gud must never be touched");
assert.ok(fs.existsSync("root.txt"), "Test 5 failed: root.txt must remain");
assert.ok(fs.existsSync(process.cwd()), "Test 5 failed: repo root must still exist");

console.log("All empty-directory pruning tests passed!");