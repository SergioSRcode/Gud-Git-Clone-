import { storeObject } from "./writeObject.js";

/*
INPUT: nested object structure
OUTPUT: hash string

RULES: 
  - The input object contains 2 kinds of entries:
    1. filenames with a hash string value
    2. dirnames with another object literal as value
      - the object value entails the contents of that dir
  - each folder should collect it's contents in a serialized form (tree buffer)
  - each tree buffer is hashed = names for subdir (first 2 chars) and file (last 38 chars).
  - each tree buffer is compressed and stored inside the hash file.
  - returns a hash for each tree buffer

MENTAL MODEL:
For each folder: Create a list of entriesLines
  - each entry one line containing: `entryType` `hash` `entryName`
  - subfolders don't have a hash yet => needs to be generated recursively
Then, serialize the list into a tree buffer. 
Generate a hash and compress buffer as described above, then save compressed buffer
to the file inside the object store.
Lastly, return the hash of the tree buffer.


DATA STRUCTURE:
array for collecting entry lines
Objects traversal: Dirs are objects that need to be traversed.


ALGO:
- GENERATE an array of entries from the input object
- CREATE a 'lines' array for collecting entry line strings
  Entry Lines:
    - a string spanning one single line
    - consisting of '<entry type> <entry hash> <entry name>'
- ITERATE over entries (root folder for first iteration)
  - for each file (identified by the string value):
    - CREATE entry line and push to 'lines' array
  - for each folder/object (doesn't have a hash yet)
    - CREATE hash (see below): call buildTree on it
    - CREATE entry line and push to 'lines' array
- TRANSFORM array to string with each entry line separated by a new line ('\n')
- GENERATE tree buffer from the entry lines string
  - GENERATE hash from tree buffer
    - first 2 chars = sub dir name in object store
    - last 38 chars = file name in sub dir (in object store)
    - RETURN the full hash
  - COMPRESS raw tree buffer
    - save compress tree buffer as content to the generated hash file (in object store).
- RETURN the full hash received from the generator hash function.


Recursive logic for "Create hash for folders":

For each entry: 
  - if it's value is a string: use it directly as hash
  - if it's an object, call buildTree on it and use the returned hash
Once all entry lines for the current folder exist:
  - serialize -> hash -> store -> return hash


Detailed recursive logic:

- Since buildTree returns a proper tree hash, we can use that to
  recursively generate each folder content hash.
- For each folder encountered (starting from root):
  - invoke buildTree with that folders content (nested object = folder contents).
  - when there is no further subfolder, the contents can be written to 'lines'
    -> when all contents can be written to 'lines', the hash can be created.
  - when there are more subfolders, for each:
    - invoke buildTree with that folders content
    - when there is no further subfolder in it => hash can be created
    - when there is another subfolder, for each:
      - invoke buildTree with that folders content
      - when there is no further subfolder in it => hash can be created
      - when there is another subfolder, for each:
        - invoke buildTree with that folders content
        - when there is no further subfolder in it => hash can be created
        - ...
        - return hash to previous buildTree call
      - hash now available => 'lines' can be completed
      - tree buffer can be created => creates hash
      - returns hash to previous buildTree call
    - hash now available => 'lines' can be completed
    - tree buffer can be created => creates hash
    - returns hash to previous buildTree call
  - hash now available => 'lines' can be completed
  - tree buffer can be created => creates hash
  - returns hash to previous buildTree call
- hash now available at root => 'lines' can be completed
- tree buffer can be created => creaes hash
- returns hash
*/

export default function buildTree(dirObject) {
  const entries = Object.entries(dirObject);

  const lines = entries.map(([name, value]) => {
    if (isString(value)) return buildEntryLine('blob', value, name);

    const hash = buildTree(value);
    return buildEntryLine('tree', hash, name);
  });

  const contentString = lines.join('\n');
  const treeBuffer = serializeContentStringToTreeObject(contentString);
  const hash = storeObject(treeBuffer);

  return hash;
}

// HELPER FUNCTIONS

function serializeContentStringToTreeObject(contentString) {
  const content = Buffer.from(contentString);
  const header = Buffer.from("tree " + content.length + "\0");

  return Buffer.concat([header, content]);
}

function isString(val) {
  return typeof val === 'string';
}

function buildEntryLine(type, hash, name) {
  return `${type} ${hash} ${name}`;
}

// ITERATIONS OF buildTree

// export default function buildTree(dirObject) {
//   const entries = Object.entries(dirObject);
//   const lines = [];

//   entries.forEach(([name, value]) => {
//     if (isString(value)) {
//       const entryLine = buildEntryLine('blob', value, name);
//       lines.push(entryLine);
//     } else {
//       const hash = buildTree(value);
//       const entryLine = buildEntryLine('tree', hash, name);
//       lines.push(entryLine);
//     }
//   });

//   const contentString = lines.join('\n');
//   const treeBuffer = serializeContentStringToTreeObject(contentString);
//   const hash = storeObject(treeBuffer);

//   return hash;
// }

// export default function buildTree(dirObject) {
//   const keys = Object.keys(dirObject);
//   const lines = [];

//   for (let i = 0; i < keys.length; i++) {
//     const key = keys[i];
//     if (isString(dirObject[key])) {
//       const hash = dirObject[key];
//       const entryLine = buildEntryLine('blob', hash, key);
//       lines.push(entryLine);
//     } else {
//       const hash = buildTree(dirObject[key]);
//       const entryLine = buildEntryLine('tree', hash, key);
//       lines.push(entryLine);
//     }
//   }
  
//   const contentString = lines.join("\n");
//   const treeBuffer = serializeContentStringToTreeObject(contentString);
//   const hash = storeObject(treeBuffer);

//   return hash;
// }

// export default function buildTree(dirObject) {
//   const entries = Object.entries(dirObject);

//   const lines = entries.reduce((acc, [fileName, hash]) => {
//     if (isString(hash)) {
//       const entryLine = buildEntryLine('blob', hash, fileName);
//       acc.push(entryLine);
//       return acc;
//     } else {
//       hash = buildTree(hash);
//       const entryLine = buildEntryLine('tree', hash, fileName);
//       acc.push(entryLine);
//       return acc;
//     }
//   }, []);

//   const contentString = lines.join('\n');
//   const treeBuffer = serializeContentStringToTreeObject(contentString);
//   const hash = storeObject(treeBuffer);

//   return hash;
// }

// const index = {
//   "README.md": "hashA",
//   "src/app.js": "hashB",
//   "src/utils/math.js": "hashC",
// };

// // console.log(buildDirectoryStructure(index));
// console.log(buildTree(buildDirectoryStructure(index)));