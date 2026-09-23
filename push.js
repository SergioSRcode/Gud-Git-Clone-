import fs from 'node:fs';
import path from 'node:path';
import readHead from "./readHead.js";
import { collectReachableObjects } from './sync.js';
/*
Given a remote path and a local branch name, 
find out, if the remote tip commit is an ancestor of the local branch.
If yes, copy each object the remote lacks into its object store.
Also update the remotes ref to the new tip (the local tip).

INPUT: string (remote path), string (branch name - local)
OUTPUT: -
SIDEEFFECT: Writes objects to remote path

=== MM ===
Resolve local branch tip and remote branch tip. 
If remote tip is an ancestor of local, collect all reachable objs
from the local tip and copy all to the remote path that don't exist yet.
Lastly update the remotes ref

==== ALGO ====
- FIND local branch tip (find head)
- FIND remote branch tip
  - construct remotePath/.gud, remotePath/.gud/refs/heads and remotePath/.gud/HEAD
- GET all reachable objects from local tip
- CHECK is remote tip inside the reachables list?
  - no? abort push
  - yes => continue
- ITERATE over reachables list:
  - For each hash:
    - resolve the dir and filename (dir = 0, 2; file = 2 => end)
    - check if the file exists
      - if no => create it/write it
      - if yes, continue to next hash
- UPDATE remotes ref (HEAD) to the current tip (same as local)

NOTE:
if remote tip doesn't exist, omit ancestry check and push all objects
*/

export default function push(remotePath, branchName) {
  const localTip = findBranchTip(branchName);
  if (!localTip) return;

  const remoteTip = readHead(remotePath);
  const reachableObjHashes = collectReachableObjects(localTip);
  const { pathToHeads, pathToObjects, headName } = getGudData(remotePath);
  
  if (remoteTip && !reachableObjHashes.has(remoteTip)) {
    console.error(`! [rejected] ${branchName} --> ${headName} (non-fast-forward)`);
    console.error(`Error: Push rejected, ${headName} is not an ancestor of ${branchName}`);
    return;
  }
  
  reachableObjHashes.forEach(hash => {
    const dirName = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const destPath = path.join(pathToObjects, dirName, fileName);
    const sourcePath = path.join(getGudData(process.cwd()).pathToObjects, dirName, fileName);

    if (!fs.existsSync(destPath)) {
      const objDir = path.join(pathToObjects, dirName);
      if (!fs.existsSync(objDir)) fs.mkdirSync(objDir, { recursive: true });

      fs.copyFileSync(sourcePath, destPath);
    } 
  });

  fs.writeFileSync(path.join(pathToHeads, branchName), localTip);
}

function findBranchTip(branchName, root = process.cwd()) {
  const branchPath = path.join(root, '.gud', 'refs', 'heads', branchName);
  if (!fs.existsSync(branchPath)) return null;

  const hash = fs.readFileSync(branchPath, 'utf8');
  if (!hash) return null;

  return hash.trim();
}

function getGudData(root = process.cwd()) {
  const pathToGud = path.join(root, '.gud');
  const pathToHeads = path.join(pathToGud, 'refs', 'heads');
  const pathToHeadRef = path.join(pathToGud, 'HEAD');
  const pathToObjects = path.join(pathToGud, 'objects');
  const headName = path.basename(pathToHeadRef);

  return { pathToGud, pathToHeads, pathToHeadRef, pathToObjects, headName };
}

// const remPath = path.join(process.cwd(), 'subdir');
// push(remPath, 'main');
// push(remPath, 'main');
// findBranchTip('banana');