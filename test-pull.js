// test-pull.js
import pull from "./pull.js";
import push from "./push.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import checkout from "./checkout.js";
import readHead from "./readHead.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT = process.cwd();
const LOCAL = path.join(ROOT, "test-pull-local");
const REMOTE = path.join(ROOT, "test-pull-remote");
const OTHER = path.join(ROOT, "test-pull-other");

function fresh(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function localTipOf(repo, branch = "main") {
  return fs.readFileSync(path.join(repo, ".gud", "refs", "heads", branch), "utf-8").trim();
}

// Setup: remote gets an initial commit (via a "seed" repo that pushes to it)
fresh(LOCAL); fresh(REMOTE); fresh(OTHER);
process.chdir(REMOTE); init();
process.chdir(OTHER); init();
fs.writeFileSync("shared.txt", "v1\n");
add("shared.txt");
commit("seed commit");
const seed = readHead();
push(REMOTE, "main"); // remote now has main -> seed

// LOCAL clones by pulling from remote
process.chdir(LOCAL); init();

// Test 1: pulling into an empty local repo fast-forwards and restores files
pull(REMOTE, "main");
assert.strictEqual(localTipOf(LOCAL), seed, "Test 1 failed: local ref not set to remote tip");
assert.ok(fs.existsSync("shared.txt"), "Test 1 failed: pulled file not restored");
assert.strictEqual(fs.readFileSync("shared.txt", "utf-8"), "v1\n", "Test 1 failed: pulled content wrong");

// Test 2: remote advances (via OTHER), local pulls the new commit (fast-forward)
process.chdir(OTHER);
fs.writeFileSync("shared.txt", "v2\n");
add("shared.txt");
commit("second seed commit");
const seed2 = readHead();
push(REMOTE, "main");

process.chdir(LOCAL);
pull(REMOTE, "main");
assert.strictEqual(localTipOf(LOCAL), seed2, "Test 2 failed: local didn't fast-forward to new remote tip");
assert.strictEqual(fs.readFileSync("shared.txt", "utf-8"), "v2\n", "Test 2 failed: file not updated to v2");

// Test 3: pulling again with no remote changes = already up to date (ref unchanged)
const before = localTipOf(LOCAL);
pull(REMOTE, "main");
assert.strictEqual(localTipOf(LOCAL), before, "Test 3 failed: up-to-date pull changed ref");

// Test 4: pulling a branch the remote doesn't have is handled gracefully
const before4 = localTipOf(LOCAL);
pull(REMOTE, "nonexistent");
assert.strictEqual(localTipOf(LOCAL), before4, "Test 4 failed: pulling missing remote branch altered state");

// Test 5: the fetched objects are valid locally (can walk the pulled commit's tree)
process.chdir(LOCAL);
import { parseCommit } from "./commit.js";
import readObject from "./readObject.js";
const pulledTree = parseCommit(localTipOf(LOCAL)).tree;
const treeContent = readObject(pulledTree);
assert.ok(treeContent !== null, "Test 5 failed: pulled tree object not present/valid locally");
assert.ok(treeContent.toString("utf-8").includes("shared.txt"), "Test 5 failed: pulled tree missing expected file");

console.log("All fast-forward pull tests passed!");