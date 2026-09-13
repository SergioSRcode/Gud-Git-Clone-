import { parseCommit } from "./commit.js";
/*
1. Find the common ancestor of 2 branches

INPUT: string1, string 2 (commit hashes)
OUTPUT: string (ancestor commit hash)

MM: Collect all commit hashes in the ancestor line of arg1, then 
iterate over ancestors of arg2 and return the common ancestor if found else null.

DS:
Set for collecting hashes

ALGO:
1. create a set

RECURSIVE HELPER:
  INPUT: string/arg1
  OUTPUT: -
  SIDEEFFECT: updates set

  2. Put arg1 in set
  3. GET parent of arg1
  4. IF parent is null - return;
  5. recurse passing in parent

RECURSIVE HELPER 2:
  INPUT: string/arg2
  OUTPUT: string | null

  6. CHECK if arg is in set
    - yes -> return arg
  7. NO -> GET parent
    - if parent === null --> return null
  9. recurse passing in parent

10. return val returned by HELPER 2
*/

export default function merge() {}

// NOTE: maybe changing helpers to iterative (while parent !== null) 
// to avoid stack overflow due to multiple recursive calls.
export function findMergeBase(commitHashA, commitHashB) {
  const commitAncestorsA = new Set();

  function populateAllAncestorsSet(commitHash) {
    if (commitAncestorsA.has(commitHash)) return;  // avoids rewalks on two-parent commits
    commitAncestorsA.add(commitHash);

    const parent = parseCommit(commitHash).parent;
    if (parent === null) return;

    populateAllAncestorsSet(parent);
  }

  populateAllAncestorsSet(commitHashA);

  function findCommonAncestor(commitHash) {
    if (commitAncestorsA.has(commitHash)) return commitHash;
    
    const parent = parseCommit(commitHash).parent;
    if (parent === null) return null;

    return findCommonAncestor(parent);
  }

  const commonAncestor = findCommonAncestor(commitHashB);

  return commonAncestor;
}



// console.log(findMergeBase("cd68bc8ba207abe857c5522f04b45c6c17e679ab", "6e6dcba315be806cfa1a3d32d9b2de59e08c43c7"));