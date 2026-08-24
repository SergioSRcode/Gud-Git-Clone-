import { parseCommit } from "./commit.js";
import { getPathToGud } from "./pathToGud.js";
import readObject from "./readObject.js";
import path from 'node:path';
import fs from 'node:fs';
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
export default function checkout(commitHash) {
  const rootTreeHash = parseCommit(commitHash).tree;
  writeObjToPath(rootTreeHash, process.cwd());
}

function writeObjToPath(treeHash, dirPath) {
  const objBuffer = readObject(treeHash);
  if (objBuffer === null) return;

  const linesString = objBuffer.toString('utf8'); 
  const lines = linesString.split('\n');
  
  lines.forEach(line => {
    const [ type, hash, name ] = line.split(' ');
    const pathToObj = path.join(dirPath, name);

    if (type === 'blob') {
      const contentBuffer = readObject(hash);
      if (contentBuffer === null) return;

      fs.writeFileSync(pathToObj, contentBuffer); 
    } else if (type === 'tree') { 
      fs.mkdirSync(pathToObj, { recursive: true });
      writeObjToPath(hash, pathToObj);
    }
  });
}

checkout('f786d9987a8f3575cb05556f2da1d27d3a57327f')