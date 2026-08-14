import path from 'node:path';
import fs from 'node:fs';
import { getPathToGud } from './pathToGud.js';

export default function readIndex() {
  const gudPath = getPathToGud();
  const pathToIndex = path.join(gudPath,'index');

  if (!fs.existsSync(pathToIndex)) {
    return {};
  }

  const index = fs.readFileSync(pathToIndex, 'utf8');

  return JSON.parse(index);
}

// console.log(readIndex());