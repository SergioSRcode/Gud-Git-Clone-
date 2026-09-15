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

    const parents = parseCommit(commitHash).parents;
    if (parents.length === 0) return;

    parents.forEach(parent => populateAllAncestorsSet(parent));
  }

  populateAllAncestorsSet(commitHashA);

  function findCommonAncestor(commitHash) {
    if (commitAncestorsA.has(commitHash)) return commitHash;
    
    const parents = parseCommit(commitHash).parents;
    if (parents.length === 0) return null;

    for (const parent of parents) {
      const found = findCommonAncestor(parent);
      if (found) return found;
    }

    return null;
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

/*
Create a function that takes 3 flat maps, one baseline that
records the state before any changes, one that records any changes
we made on the baseline and one that records any changes someone else made
on the baseline. A map is path-keyed:
{
  path/to/file: hashA,
  pathto/file: hashB,
}

Compare all three maps against each other to record all changes
made to the baseline map. Should there be a change on the same file
on both sides: ours and theirs, record it as conflict.

The result should be a map containing: 
1: the combined file map of successful changes
2: a list of confliciting changes (only paths)

The result should have a shape like this:
{
  merged: {
    path/to/file: hashA,
    pathto/file: hashB,
    ...
  },
  conflicts: [
    path/to/another/file,
    pathtofile,
    ...
  ]
}

INPUT: obj map1 (base), obj map2 (ours), obj map3 (theirs)
OUTPUT: obj map

==== RULES ====
- each argument map is path-keyed with a hash value:
  path: hash
- ours and theirs must be compared against base for mismatches/changes:
  - if only one side is mismatched, take that one
  - else mismatches are then checked against the other (ours or theirs):
    - if they are the same (same hash) -> take any
    - else it's a conflict path
- non-existing paths are undefined
- an object map containing 2 properties is returned:
  - 1: a map containing all successful changes
  - 2: a list of conflicting paths/changes


==== MM ====
Collect all paths in a set, then iterate over set keys, comparing
key-value pairs of our map objects against each other.
Collect valid changes to base and conflicting paths between ours and theirs.

==== ALGO ====
- CREATE object literal (result) with 2 properties (merged: {}, conflicts: [])
- COLLECT all paths into a set
- ITERATE over set:
  - for each path:
    - check if ours[path] is equal to base[path]
    - check if theirs[path] is equal to base[path]
    - if both are === base[path] save 'path: hash' to result[merged]
    - if only one differs => save the 'path: hash' of the mismatch
      - NOTE: if the mismatch value is undefined, skip it
    - if both differ => PUSH path to conflict
- RETURN result
*/

export function threeWayMerge(base, ours, theirs) {
  const result = { merged: {}, conflicts: [] };
  const paths = [...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)];
  const uniquePaths = new Set(paths);

  uniquePaths.forEach(filePath => {
    const oursIsUnchanged = ours[filePath] === base[filePath];
    const theirsIsUnchanged = theirs[filePath] === base[filePath];

    if (oursIsUnchanged && theirsIsUnchanged) {
      result.merged[filePath] = base[filePath];
    } else if (oursIsUnchanged) {
      if (theirs[filePath] !== undefined) result.merged[filePath] = theirs[filePath];
    } else if (theirsIsUnchanged) {
      if (ours[filePath] !== undefined) result.merged[filePath] = ours[filePath];
    } else {  // both are changed
      if (ours[filePath] === theirs[filePath]) {
        // take any one version
        if (ours[filePath] !== undefined) result.merged[filePath] = ours[filePath];
      } else {
        result.conflicts.push(filePath);
      }
    }
  });
  
  return result;
}

// console.log(threeWayMerge({
//   'pathto/file': 'hashB',  
//   'unchanged': 'no change'
//   }, {
//   'path/to/file': 'hashA',
//   'unchanged': 'no change',
//   'dingo': 'what'
//   }, {
//   'path/to/file': 'hashA',
//   'pathto/file': 'hashB',
//   'unchanged': 'no change',
//   'dingo': 'babies'
//   }
// ));