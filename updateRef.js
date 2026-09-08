import fs from 'node:fs';
import { getPathToCurrentHead } from './readHead.js';

export default function updateRef(hash) {
  const pathToCurrentHead = getPathToCurrentHead();
  if (!pathToCurrentHead) return null;
  
  fs.writeFileSync(pathToCurrentHead, hash + '\n');
}

// updateRef('aaaa8fe5ccb19ba61c4c0873d391e987982fbbd3');