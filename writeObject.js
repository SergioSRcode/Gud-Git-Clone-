import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { buildBlob } from './buildBlob.js';
import hashBlob from './hashBlob.js';

export default function writeObject(content) {
  const blob = buildBlob(content);  // returns a blob
  const hash = hashBlob(blob);  // returns a hashed blob

  const compressedBlob = zlib.deflateSync(blob); // compresses blob = file content

  const blobDirName = hash.slice(0, 2);  // first 2 chars of hash = dir name
  const blobFileName = hash.slice(2);    // remaining chars = file name
  const blobPath = path.join(process.cwd(), '.gud', 'objects', blobDirName);

  fs.mkdirSync(blobPath, { recursive: true });
  fs.writeFileSync(path.join(blobPath, blobFileName), compressedBlob);
  
  return hash;
}

// const buffer = Buffer.from('hello world\n');
// console.log(writeObject(buffer));