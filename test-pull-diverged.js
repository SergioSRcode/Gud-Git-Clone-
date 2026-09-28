// test-pull-diverged.js
import pull from "./pull.js";
import push from "./push.js";
import commit from "./commit.js";
import add from "./add.js";
import init from "./init.js";
import checkout from "./checkout.js";
import readHead from "./readHead.js";
import { parseCommit } from "./commit.js";
import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT = process.cwd();
const LOCAL = path.join(ROOT, "test-pulldiv-local");
const REMOTE = path.join(ROOT, "test-pulldiv-remote");
const OTHER = path.join(ROOT, "test-pulldiv-other");

function fresh(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
function localTipOf(repo, branch = "main") {
  return fs.readFileSync(path.join(repo, ".gud", "refs", "heads", branch), "utf-8").trim();
}

// --- Setup: remote seeded with a base commit; LOCAL and OTHER both start from it ---
fresh(LOCAL); fresh(REMOTE); fresh(OTHER);
process.chdir(REMOTE); init();

process.chdir(OTHER); init();
fs.writeFileSync("shared.txt", "base\n");
add("shared.txt");
commit("base");
push(REMOTE, "main");

process.chdir(LOCAL); init();
pull(REMOTE, "main"); // LOCAL now at base
const base = localTipOf(LOCAL);

// OTHER advances remote by editing a DIFFERENT file (no conflict)
process.chdir(OTHER);
fs.writeFileSync("other-file.txt", "other work\n");
add("other-file.txt");
commit("other adds file");
push(REMOTE, "main");
const remoteAdvanced = localTipOf(REMOTE);

// LOCAL diverges by editing yet ANOTHER file
process.chdir(LOCAL);
fs.writeFileSync("local-file.txt", "local work\n");
add("local-file.txt");
commit("local adds file");
const localDiverged = localTipOf(LOCAL);

// Test 1: diverged pull (no conflict) creates a merge commit
pull(REMOTE, "main");
const afterPull = localTipOf(LOCAL);
assert.notStrictEqual(afterPull, localDiverged, "Test 1 failed: pull should have created a merge commit");
assert.notStrictEqual(afterPull, remoteAdvanced, "Test 1 failed: diverged pull is not a fast-forward");

// Test 2: the merge commit has two parents (local's tip and remote's tip)
const parents = parseCommit(afterPull).parents;
assert.strictEqual(parents.length, 2, "Test 2 failed: merge commit should have 2 parents");
assert.ok(parents.includes(localDiverged), "Test 2 failed: missing local parent");
assert.ok(parents.includes(remoteAdvanced), "Test 2 failed: missing remote parent");

// Test 3: working directory contains BOTH sides' files after diverged pull
assert.ok(fs.existsSync("local-file.txt"), "Test 3 failed: local file missing");
assert.ok(fs.existsSync("other-file.txt"), "Test 3 failed: remote file missing");
assert.ok(fs.existsSync("shared.txt"), "Test 3 failed: base file missing");

// Test 4: conflicting diverged pull does NOT create a commit (aborts, ref unchanged)
fresh(LOCAL); fresh(REMOTE); fresh(OTHER);
process.chdir(REMOTE); init();
process.chdir(OTHER); init();
fs.writeFileSync("c.txt", "base\n");
add("c.txt");
commit("base");
push(REMOTE, "main");
process.chdir(LOCAL); init();
pull(REMOTE, "main");
process.chdir(OTHER);
fs.writeFileSync("c.txt", "other version\n");
add("c.txt");
commit("other edits c");
push(REMOTE, "main");
process.chdir(LOCAL);
fs.writeFileSync("c.txt", "local version\n");
add("c.txt");
commit("local edits c");
const localBeforeConflict = localTipOf(LOCAL);
pull(REMOTE, "main"); // conflict on c.txt
assert.strictEqual(localTipOf(LOCAL), localBeforeConflict, "Test 4 failed: conflicting pull should not create a commit");

// Test 5: after a clean diverged pull, a subsequent up-to-date pull is a no-op
fresh(LOCAL); fresh(REMOTE); fresh(OTHER);
process.chdir(REMOTE); init();
process.chdir(OTHER); init();
fs.writeFileSync("s.txt", "base\n");
add("s.txt"); commit("base"); push(REMOTE, "main");
process.chdir(LOCAL); init(); pull(REMOTE, "main");
process.chdir(OTHER);
fs.writeFileSync("o.txt", "o\n"); add("o.txt"); commit("o"); push(REMOTE, "main");
process.chdir(LOCAL);
fs.writeFileSync("l.txt", "l\n"); add("l.txt"); commit("l");
pull(REMOTE, "main"); // diverged → merge
const afterMerge = localTipOf(LOCAL);
pull(REMOTE, "main"); // now up to date
assert.strictEqual(localTipOf(LOCAL), afterMerge, "Test 5 failed: second pull should be up-to-date no-op");

console.log("All diverged pull tests passed!");