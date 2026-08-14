import fs from 'node:fs';
import writeObject from './writeObject.js';
import readIndex from './readIndex.js';
import writeIndex from './writeIndex.js';
import repoStructureIntact from './repoStructureIntact.js';
import { getPathToGud } from './pathToGud.js';

export default function add(filePath) {
  const gudPath = getPathToGud();
  if (!repoStructureIntact(gudPath)) {
    console.error('To use .gud commands, initialize a .gud repository with "init" first');
    return;
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const hash = writeObject(buffer);
    
    const currIndex = readIndex();
    currIndex[filePath] = hash;

    writeIndex(currIndex);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`fatal: pathspec '${filePath}' does not exist.`);
    } else {
      console.error(err);
    }
  }
}

// add('test-index.js');