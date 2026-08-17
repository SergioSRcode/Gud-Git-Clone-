export default function buildDirectoryStructure(index) {
  const entries = Object.entries(index);
  const result = {};

  entries.forEach(entry => {
    const dirList = entry[0].split("/");
    const fileName = dirList.pop();
    const hash = entry[1];

    let currPos = result;  // root
    
    dirList.forEach((dir, idx) => {
      if (!currPos[dir]) currPos[dir] = {};
      currPos = currPos[dir];
    });

    currPos[fileName] = hash;
  });

  return result;
}