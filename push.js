import fs from 'node:fs';
import path from 'node:path';
import readHead from "./readHead.js";
import { getPathToGud } from "./pathToGud.js";
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
*/

export default function push(remotePath, branchName) {
  const localTip = findBranchTip(branchName);
  
}

function findBranchTip(branchName, root = process.cwd()) {
  const branchPath = path.join(root, '.gud', 'refs', 'heads', branchName);
  if (!fs.existsSync(branchPath)) return null;

  const hash = fs.readFileSync(branchPath, 'utf8');

  return hash
}

findBranchTip('banana');