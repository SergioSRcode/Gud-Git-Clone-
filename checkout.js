import { parseCommit } from "./commit.js";
import readIndex from "./readIndex.js";
import readObject from "./readObject.js";
import writeIndex from "./writeIndex.js";
import path from 'node:path';
import fs from 'node:fs';
import createBranch from "./createBranch.js";
import { getPathToGud } from "./pathToGud.js";
import readHead from "./readHead.js";
/*
INPUT: hash string
OUTPUT: /
SIDEEFFECT: overrides files

=== Mental Model ===
Get root tree hash to read the root tree entries (blob or tree).
For each blob, read the content from the object store and write to disk.
For each tree, create a dir with its name and recurse into it. 
  Read the subtree and repeat the process

==== ALGO ====
1. Parse commit hash to get the root tree hash

// RECURSIVE HELPER
INPUT: tree hash, path
OUTPUT: /

2. get path to obj 
3. read obj
4. inflate and parse obj
  - strip the heading 'tree <size>\0'
5. GET an array of each listing (string) within the root dir
6. FOR EACH listing
  - GET type, hash, name
  - if blob => 
      get content from hash
      create/override filename
      save content to file
  - if tree =>
      append name to path
      write dir with name to disk
      invoke HELPER with hash, newPath
*/
export default function checkout(arg1, arg2) {
  if (arg1 === '-b') {
    const branchName = arg2;
    const created = createBranch(branchName);
    if (!created) return;

    const newBranchPath = path.join(getPathToGud(), 'refs', 'heads', branchName);
    writeAttachedHead(newBranchPath);
  } else {
    if (!arg1) {
      console.error('checkout argument is required');
      return;
    }
    const branchPath = path.join(getPathToGud(), 'refs', 'heads', arg1);
    let commitHashToRestore = '';

    if (fs.existsSync(branchPath)) {  // arg is branch name
      writeAttachedHead(branchPath);
      commitHashToRestore = readHead();
    } else {  // arg is raw commit hash
      const hash = arg1;
      if (readObject(hash) === null) {
        console.error('Cannot checkout non-existing commit');
        return;
      }

      writeDetachedHead(hash);
      commitHashToRestore = hash;
    }

    restore(commitHashToRestore);
  }
}

function writeAttachedHead(pathToHeadRef) {
  const gudPath = getPathToGud();
  const relativePath = path.relative(gudPath, pathToHeadRef);
  const pathToHead = path.join(gudPath, 'HEAD');
 
  fs.writeFileSync(pathToHead, `ref: ${relativePath}\n`);
}

function writeDetachedHead(hash) {
  const pathToHead = path.join(getPathToGud(), 'HEAD');
 
  fs.writeFileSync(pathToHead, hash + '\n');
}

export function restore(commitHash) {
  const rootTreeHash = parseCommit(commitHash).tree;
  const commitTreeEntries = writeObjToPath(rootTreeHash, process.cwd());
  const currentEntries = readIndex();
  removeStaleFiles(currentEntries, commitTreeEntries);
  writeIndex(commitTreeEntries);
}

function writeObjToPath(treeHash, dirPath) {
  const objBuffer = readObject(treeHash);
  if (objBuffer === null) return {};

  const linesString = objBuffer.toString('utf8'); 
  const lines = linesString.split('\n');
  let paths = {};
  
  lines.forEach(line => {
    const [ type, hash, name ] = line.split(' ');
    const pathToObj = path.join(dirPath, name);

    if (type === 'blob') {
      const contentBuffer = readObject(hash);
      if (contentBuffer === null) return;

      fs.writeFileSync(pathToObj, contentBuffer);
      const relativePath = path.relative(process.cwd(), pathToObj);
      paths[relativePath] = hash;
    } else if (type === 'tree') { 
      fs.mkdirSync(pathToObj, { recursive: true });
      const prevPaths = writeObjToPath(hash, pathToObj);
      paths = { ...prevPaths, ...paths };
    }
  });

  return paths;
}

function removeStaleFiles(oldEntries, newEntries) {
  const oldPaths = Object.keys(oldEntries);
  
  oldPaths.forEach(filePath => {
    const blobHash = newEntries[filePath];

    if (!blobHash) {
      const fullPath = path.join(process.cwd(), filePath);
      fs.unlinkSync(fullPath);
      removeEmptyDirs(filePath);
    }
  });
}

/*
INPUT: path
OUTPUT: /
SIDEEFFECT: removes empty dir

MM:
if path === empty, return;
truncate the last part of the path (file on first iteration, subdir after that),
then check if current folder path is empty, if yes, remove that folder.
Then call removeEmptyDirs with the truncated path.


ALGO:
1. if filePath is equal to '.', return;
2. remove last part of path
3. check if current subdir is empty, if no, return;
  - if yes: remove subdir
4. call removeEmptyDirs with new path
*/

function removeEmptyDirs(filePath) {
  const truncatedPath = path.dirname(filePath);
  if (truncatedPath === '.') return;

  const root = process.cwd();
  const fullPath = path.join(root, truncatedPath);

  const isEmptyDir = fs.readdirSync(fullPath).length === 0;
  if (!isEmptyDir) return;

  fs.rmdirSync(fullPath);
  removeEmptyDirs(truncatedPath);
}

// console.log(path.dirname("."));

// removeEmptyDirs('tester2/newTest.txt');
// removeEmptyDirs('notEmpty/empty/test.txt');
// removeEmptyDirs('testRoot.md');
// removeEmptyDirs('.');

// checkout('f786d9987a8f3575cb05556f2da1d27d3a57327f')