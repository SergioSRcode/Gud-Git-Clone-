import { parseCommit } from "./commit.js";
import readObject from "./readObject.js";

/*
Reachability Walk:
Given a commit hash, collect every object from it:
  - the commit object itself
  - its tree (root) and every subtree and blob under it
  - each parent commit and their trees/blobs


INPUT: string (commitHash)
OUTPUT: set (all object hashes)

MM: 
Put commit hash in set. Get its tree hash and its parentHashes.
Recurse the tree and get all hashes (subtrees + blobs) --> flattenTree reconstr.
  - put them all in the set
Recurse each parent:
  - for each add the hash to the set
  - call collectReachableObjects with the parent


ALGO:
- CREATE a set initialized with the input commitHash
- GET its tree hash
- GET its parent(s)
- RECURSE the tree hash, add all blob and subtree hashes to set
  -> adjust flattenTree logic to collect tree hashes 
- RECURSE each parent:
  - if parent hash exists in set, return
  - else add the hash to the set
  - call function again
- RETURN set

*/

export function collectReachableObjects(commitHash, root = process.cwd()) {
  const hashList = new Set();

  function pushTreesAndBlobs(tree) {
    const objBuffer = readObject(tree, root);
    if (objBuffer === null) return;

    const linesString = objBuffer.toString('utf8'); 
    const lines = linesString.split('\n');

    lines.forEach(line => {
      const [ type, hash ] = line.split(" ");
      if (hashList.has(hash)) return;  // skipping multiple walks

      if (type === 'tree') {
        hashList.add(hash);
        pushTreesAndBlobs(hash);
      } else if (type === 'blob') {
        hashList.add(hash);
      }
    });
  }

  function populateHashList(commitHash) {
    const { tree, parents } = parseCommit(commitHash, root);

    hashList.add(commitHash);
    hashList.add(tree);
    pushTreesAndBlobs(tree);

    parents.forEach(parentHash => {
      if (hashList.has(parentHash)) return;  // skipping multiple walks
      populateHashList(parentHash);
    });
  }

  populateHashList(commitHash);
  return hashList;
}

// console.log(collectReachableObjects('cd68bc8ba207abe857c5522f04b45c6c17e679ab'));
