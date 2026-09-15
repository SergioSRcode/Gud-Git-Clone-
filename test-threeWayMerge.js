// test-threeWayMerge.js
import { threeWayMerge } from "./merge.js";
import assert from "assert";

// Helper to make the assertions readable
function run(base, ours, theirs) {
  return threeWayMerge(base, ours, theirs);
}

// Test 1: file changed only on ours → take ours
{
  const { merged, conflicts } = run(
    { "a.txt": "base" },
    { "a.txt": "ours" },
    { "a.txt": "base" }
  );
  assert.strictEqual(conflicts.length, 0, "Test 1 failed: unexpected conflict");
  assert.strictEqual(merged["a.txt"], "ours", "Test 1 failed: should take ours");
}

// Test 2: file changed only on theirs → take theirs
{
  const { merged, conflicts } = run(
    { "a.txt": "base" },
    { "a.txt": "base" },
    { "a.txt": "theirs" }
  );
  assert.strictEqual(conflicts.length, 0, "Test 2 failed: unexpected conflict");
  assert.strictEqual(merged["a.txt"], "theirs", "Test 2 failed: should take theirs");
}

// Test 3: file changed differently on both → conflict
{
  const { merged, conflicts } = run(
    { "a.txt": "base" },
    { "a.txt": "ours" },
    { "a.txt": "theirs" }
  );
  assert.ok(conflicts.includes("a.txt"), "Test 3 failed: should report conflict on a.txt");
}

// Test 4: both added the same new file identically → no conflict, take it
{
  const { merged, conflicts } = run(
    {},
    { "new.txt": "same" },
    { "new.txt": "same" }
  );
  assert.strictEqual(conflicts.length, 0, "Test 4 failed: identical add should not conflict");
  assert.strictEqual(merged["new.txt"], "same", "Test 4 failed: should include the added file");
}

// Test 5: file deleted on theirs, untouched on ours → deleted in result
{
  const { merged, conflicts } = run(
    { "gone.txt": "base", "keep.txt": "base" },
    { "gone.txt": "base", "keep.txt": "base" },
    { "keep.txt": "base" } // theirs deleted gone.txt
  );
  assert.strictEqual(conflicts.length, 0, "Test 5 failed: clean delete should not conflict");
  assert.ok(!("gone.txt" in merged), "Test 5 failed: deleted file should be absent from merged");
  assert.strictEqual(merged["keep.txt"], "base", "Test 5 failed: untouched file should remain");
}

// Test 6: file deleted on theirs and ours → deleted in result
{
  const { merged, conflicts } = run(
    { "gone.txt": "base", "keep.txt": "base" },
    { "keep.txt": "base" }, // ours deleted gone.txt
    { "keep.txt": "base" } // theirs deleted gone.txt
  );
  assert.strictEqual(conflicts.length, 0, "Test 6 failed: clean delete should not conflict");
  assert.ok(!("gone.txt" in merged), "Test 6 failed: deleted file should be absent from merged");
  assert.strictEqual(merged["keep.txt"], "base", "Test 6 failed: untouched file should remain");
}

console.log("All three-way merge tests passed!");