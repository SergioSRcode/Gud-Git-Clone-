import { parseCommit } from "./commit.js";
import readIndex from "./readIndex.js";
import readObject from "./readObject.js";
import writeIndex from "./writeIndex.js";
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
    }
  });
}

// function parseNewLines(newLines) {
//   const lines = Object.keys(newLines);
//   const parsedPaths = {};

//   lines.forEach(line => {
//     const relPath = path.relative(process.cwd(), line);
//     parsedPaths[relPath] = newLines[line];
//   });

//   return parsedPaths;
// }

// function parsefullToRelPath(fullPath) {
//   return path.relative(process.cwd(), fullPath);
// }

// parsefullToRelPath('/Users/sergioravera/projects/gitClone/git-clone/tester2/newTest.txt')

// parseNewLines({
//   '/Users/sergioravera/projects/gitClone/git-clone/tester2/newTest.txt': 'fff2809779109e3ba2197b59cb1eb3b9730b0f7e',
//   '/Users/sergioravera/projects/gitClone/git-clone/tester/test.txt': '74aee647ea50aa42e21353064913846fa372b5e5',
//   '/Users/sergioravera/projects/gitClone/git-clone/testRoot.md': '1e487f3cc346fa72b4cb2e67380387855a473d81'
// });
// checkout('f786d9987a8f3575cb05556f2da1d27d3a57327f')