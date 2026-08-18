// export default function buildDirectoryStructure(index) {
//   const entries = Object.entries(index);
//   const result = {};

//   entries.forEach(entry => {
//     const dirList = entry[0].split("/");
//     const fileName = dirList.pop();
//     const hash = entry[1];

//     let currPos = result;  // root
    
//     dirList.forEach((dir, idx) => {
//       if (!currPos[dir]) currPos[dir] = {};
//       currPos = currPos[dir];
//     });

//     currPos[fileName] = hash;
//   });

//   return result;
// }

// INPUT: index object
// OUTPUT: Object mirroring nested folder structure

/*
Rules:
  - input index consists is an object with flat, path-keyed indecies:
    - e.g. { "README.md": "hashA", "src/app.js": "hashB" }
    - properties = paths to file
    - value = hash of file
  - folders are separated by a "/"
  - each folder has an object as value
  - each file has its hash as value
  - files are always the endpoint of the pathstring
  - each folder/dir should be derived from the pathstrings
  - all pathstrings from the input obj create the nested obj structure


MENTAL MODEL:

Take a flat object structure with path-keyed hashes as input.
Create an empty object signifying the root dir.
For each path, destructure the it into individual folders.
For each folder, create or update the required nested structure until the file is reached.
Finally return the nested structure.

INDEX
{
  "README.md": "hashA",
  "src/app.js": "hashB",
  "src/utils/math.js": "hashC"
}

RESULT
{
  "README.md": "hashA",
  "src": {
    "app.js": "hashB",
    "utils": {
      "math.js": "hashC" 
    }
  }
}
  

ALGO:

Setup:
  - CREATE result = empty object (root)
  - GET entries (path + hash) of input index object
  - CREATE currentDir var, tracking which folder we are curr in (let)

- ITERATE over entries arr
  - for each entry:
    + GET the path string => "src/app.js"
    + GET the hash string => "hashA"
    + SPLIT the path string at "/" => ["stc", "app.js"] = dirs
    
    - ITERATE over dirs
      - for each dir:
        + if dir is last element = dir === file
          => assign file as a property to the current dir object
            - use the hash as its value

        + else: create key-value pair in currentDir:
          currentDir[dir] = {}
        + SET currentDir to the newly created sub-obj of the previous one

- RETURN result

Key idea: 
Result === root
  - create a nested obj inside root
  - reassign the current position to point to that nested object
    - since current position is just a pointer, the result obj is mutated along the way
    - create nested obj inside current position
    - reassign the current position to piont to the new nested obj
      - since current pos is just a pointer, result is still mutated along the ways
      ...
*/

export default function buildDirectoryStructure(index) {
  const result = {};  // root
  const entries = Object.entries(index); // [ [path, hash], [path, hash] ]

  entries.forEach(([pathString, hash]) => {
    const dirs = pathString.split("/");
    const file = dirs.pop();
    let currentDir = result;  // initialized to root
    
    dirs.forEach(dir => {
      if (!currentDir[dir]) currentDir[dir] = {};
      currentDir = currentDir[dir];
    });

    currentDir[file] = hash;
  });

  return result;
}

// export default function buildDirectoryStructure(index) {
//   const result = {};  // root
//   const entries = Object.entries(index); // [ [path, hash], [path, hash] ]

//   entries.forEach(([pathString, hash]) => {
//     const dirs = pathString.split("/");
    
//     dirs.reduce((acc, dir, idx) => {
//       if (idx === dirs.length - 1) {
//         acc[dir] = hash;
//       } else {
//         if (!acc[dir]) acc[dir] = {};
//         acc = acc[dir];
//       }

//       return acc;

//     }, result);
//   });

//   return result;
// }

// const index = {
//   "README.md": "hashA",
//   "src/app.js": "hashB",
//   "src/utils/math.js": "hashC"
// };

// console.log(buildDirectoryStructure(index));