import path from 'node:path';
import fs from 'node:fs';
import { getPathToGud } from './pathToGud.js';

export default function writeIndex(entries) {
  const gudPath = getPathToGud();
  const pathToIndex = path.join(gudPath,'index');

  const index = JSON.stringify(entries);
  fs.writeFileSync(pathToIndex, index);
}

// const testEntries = { "src/app.js": "a94afe5cc...", "README.md": "e69de29bb2..."};
// writeIndex(testEntries);