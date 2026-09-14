import { parseCommit } from "./commit.js";
import { restore } from "./checkout.js";
import updateRef from "./updateRef.js";
import { getPathToGud } from "./pathToGud.js";
import readHead from "./readHead.js";
import path from 'node:path';
import fs from 'node:fs';
import readObject from "./readObject.js";
import buildDirectoryStructure from "./buildDirectoryStructure.js";
import buildTree from "./buildTree.js";
import { storeObject } from "./writeObject.js";

export default function merge(targetBranchName) {
  const currentHash = readHead();
  if (currentHash === null) {
    console.error("Initial commit is required for merge");
    return;
  } 

  const targetPath = path.join(getPathToGud(), 'refs', 'heads', targetBranchName);
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: ${targetBranchName} is not a branch name.`);
    return;
  }

  const targetHash = fs.readFileSync(targetPath, 'utf8').trim();
  const commonAncestor = findMergeBase(currentHash, targetHash);

  if (commonAncestor === targetHash) {
    console.log("Already up to date.");
    return;
  }

  if (commonAncestor === currentHash) {
    // ff-merge
    updateRef(targetHash);
    restore(targetHash);
    console.log("Fast-Forward Merge successful.");
  } else {
    // 3 way merge
    console.log("three-way merge not yet implemented");
    return;
  }
}

// console.log(merge('banana'));

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

/*
Given a hash and a prefix signifying a relative path, create a function
that walks a tree object writing all files into a map.
The map should be path-keyed with each blob hash as its value:
{
  "relative/path/to/file: blobHash,
  "relativepathto/file: blobHash, ..."
}

INPUT: string (hash), string (prefix)
OUTPUT: object map

MM:
Get list of all files/subdirs of the current tree (derived from treeHash).
For each subdir recurse appending the subdir name to prefix.
For each file, save current relative path and the blobs hash as a key-value pair

ALGO:
0. CREATE paths obj literal
1. READ treeHashContent
2. PARSE to string
3. SPLIT to a list of files/subdirs
4. ForEach entry, 
  - if type is blob: SAVE rel path and its hash to paths obj
  - if type is tree: move into that dir (recursive call: treeHash, subdir appended to prefix)
  - if prefix is "", reassign prefix with the path
    - else append "/" + "relPath"
5. RETURN paths obj
*/

export function flattenTree(treeHash, prefix = "") {
  let paths = {};

  const objBuffer = readObject(treeHash);
  if (objBuffer === null) return {};

  const linesString = objBuffer.toString('utf8'); 
  const lines = linesString.split('\n');

  lines.forEach(line => {
    const [ type, hash, name ] = line.split(" ");
    const relPath = `${!prefix ? "" : prefix + '/'}${name}`;
    
    if (type === 'tree') {
      const prevPaths = flattenTree(hash, relPath);
      paths = { ...prevPaths, ...paths };
    } else if (type === 'blob') {
      paths[relPath] = hash;
    }
  });

  return paths;
}

// flattenTree('83ecd96e847b4e3b009d8d3fe4a9ec9395a16067');
// console.log(flattenTree('83ecd96e847b4e3b009d8d3fe4a9ec9395a16067'));
// console.log(flattenTree('b060b217fd1aec8b4ecbb374f819304c25511fe1').toString());
// console.log(findMergeBase("cd68bc8ba207abe857c5522f04b45c6c17e679ab", "6e6dcba315be806cfa1a3d32d9b2de59e08c43c7"));