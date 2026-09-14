import { getPathToGud } from "./pathToGud.js";
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

/*
data context: deflated objectBuffer looks like this:

commit <size>\0<content>

*/

export default function readObject(hash) {
  if (hash === null) return null;

  const subDirName = hash.slice(0, 2);
  const objectName = hash.slice(2);
  const pathToObject = path.join(getPathToGud(), 'objects', subDirName, objectName);

  if (!fs.existsSync(pathToObject)) return null;

  const compressedObj = fs.readFileSync(pathToObject);
  const objectBuffer = zlib.inflateSync(compressedObj);
  const separatorIdx = objectBuffer.indexOf(0);
  const content = objectBuffer.subarray(separatorIdx + 1);

  return content;
}

export function readObjectSize(hash) {
  if (hash === null) return null;

  const subDirName = hash.slice(0, 2);
  const objectName = hash.slice(2);
  const pathToObject = path.join(getPathToGud(), 'objects', subDirName, objectName);

  if (!fs.existsSync(pathToObject)) return null;

  const compressedObj = fs.readFileSync(pathToObject);
  const objectBuffer = zlib.inflateSync(compressedObj);
  const contentSeparatorIdx = objectBuffer.indexOf(0);
  const headerSeparatorIdx = objectBuffer.indexOf(" ");
  const header = objectBuffer.subarray(0, contentSeparatorIdx + 1);
  const size = header.subarray(headerSeparatorIdx + 1)

  return size;
}

// console.log(readObject("5cd01f144bf1cccebbde9e93050aa740ffb48d8b"));