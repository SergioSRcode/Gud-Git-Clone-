import readHead from "./readHead.js";
import { findBranchTip, getGudData } from "./push.js";
import { collectReachableObjects } from "./sync.js";
import fs from 'node:fs';
import path from 'node:path';
import { restore } from "./checkout.js";
import { findMergeBase } from "./merge.js";

/*
Build pull handling fast-forward and already-up-to-date, 
with the diverged case bailing (placeholder).
Given a remote path and a branch name, copy all objects
that don't yet exist in the local object store to it.

INPUT: string (path), string (branch name)
OUTPUT: /
SIDEEFFECT: Write objects to obj store and restore files

Rules:
  - if remotes doesn't have a branch "branchName", bail out
  - ok if local doesn't have a branch "branchName"
  - if local doesn't have any branch yet (null) - adopt remotes tip directly
  - tip is ancestor of remote tip? ff 
  - remote tip is ancestor of local tip? bail out
  - Diverged? needs merge (temp bail out)

=== MM ===
Get both tips. If remote doesn't have a branch named "branchName", bail out.
Get remots objects and copy those to local obj store that are not in yet.
Determine, if a pull is possible. Bail out if not, else decide between
fast-forward pull or a merge. After merge, set the ref to the new tip and restore
files.


==== ALGO ====
- GET remote tip <remote>/.gud/refs/heads/<branchName>
  - if null, bail out
- GET local tip (null is fine)
- GET Set of remote objects
- ITEREATE over remote objects
  - for each:
    - construct subdir name
    - construct file name
    - check if the obj exists in local obj store
      - no? copy it to it
- DETERMINE relationship:
  - Is local tip null or an ancestor of the remote's tip?
    - yes? --> fast-forward pull
           --> set refs/heads/branchName to remote tip hash
    - no? Is remote ancestor of local's tip?
      - yes? --> bail out - already up-to-date
      - no? --> merge required (bail out for now)
- Is branchName === currently checked out branch?
  - yes? restore
*/

export default function pull(remotePath, branchName) {
  const remoteTip = findBranchTip(branchName, remotePath);
  if (remoteTip === null) {
    console.error(`"${branchName}" not found on remote`);
    return;
  }

  const localTip = findBranchTip(branchName);
  const { pathToObjects, pathToHeads, headName } = getGudData(process.cwd());
  const reachableObjHashes = collectReachableObjects(remoteTip, remotePath);
  const remoteObjPath = getGudData(remotePath).pathToObjects;
  
  reachableObjHashes.forEach(hash => {
    const dirName = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const destPath = path.join(pathToObjects, dirName, fileName);
    const sourcePath = path.join(remoteObjPath, dirName, fileName);

    if (!fs.existsSync(destPath)) {
      const objDir = path.join(pathToObjects, dirName);
      if (!fs.existsSync(objDir)) fs.mkdirSync(objDir, { recursive: true });

      fs.copyFileSync(sourcePath, destPath);
    } 
  });
  
  let isFastForward;
  if (localTip === null) {
    isFastForward = true;
  } else {
    const base = findMergeBase(localTip, remoteTip);
    if (base === remoteTip) {
      console.log(`Already up-to-date`);
      return;
    }

    isFastForward = (base === localTip);
  }

  if (isFastForward) {
    fs.writeFileSync(path.join(pathToHeads, branchName), remoteTip);
  } else {
    console.log('diverged, merge needed');
    return;
  }

  if (headName === branchName) restore(remoteTip);
}