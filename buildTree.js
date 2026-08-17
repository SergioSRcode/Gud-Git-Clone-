import { storeObject } from "./writeObject.js";

export default function buildTree(dirObject) {
  const keys = Object.keys(dirObject);
  const lines = [];

  for (let i = 0; i < keys.length; i++) {

    const key = keys[i];
    if (isString(dirObject[key])) {
      const hash = dirObject[key];
      const entryLine = buildEntryLine('blob', hash, key);
      lines.push(entryLine);
    } else {
      const hash = buildTree(dirObject[key]);
      const entryLine = buildEntryLine('tree', hash, key);
      lines.push(entryLine);
    }
  }
  
  const contentString = lines.join("\n");
  const treeBuffer = serializeContentStringToTreeObject(contentString);
  const hash = storeObject(treeBuffer);

  return hash;
}

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

// const index = {
//   "README.md": "hashA",
//   "src/app.js": "hashB",
//   "src/utils/math.js": "hashC",
// };

// // console.log(buildDirectoryStructure(index));
// console.log(buildTree(buildDirectoryStructure(index)));