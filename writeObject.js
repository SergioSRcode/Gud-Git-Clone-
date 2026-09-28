import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { buildBlob } from './buildBlob.js';
import hashObject from './hashObject.js';
import { getPathToGud } from './pathToGud.js';

export default function writeObject(content) {
  const blob = buildBlob(content);  // returns a blob
  const hash = storeObject(blob);

  return hash;
}

export function storeObject(buffer) {
  const hash = hashObject(buffer);  // returns a hashed buffer (blob or tree)

  const compressedObj = zlib.deflateSync(buffer); // compresses buffer = file content

  const objDirName = hash.slice(0, 2);  // first 2 chars of hash = dir name
  const objFileName = hash.slice(2);    // remaining chars = file name
  const objPath = path.join(getPathToGud(), 'objects', objDirName);

  fs.mkdirSync(objPath, { recursive: true });
  fs.writeFileSync(path.join(objPath, objFileName), compressedObj);
  
  return hash;
}

// const buffer = Buffer.from('hello world\n');
// console.log(writeObject(buffer));