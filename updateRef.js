import fs from 'node:fs';
import { isDetachedHead, getHeadContentString, getHeadRefPath } from './readHead.js';
import { getGudData } from './push.js';

export default function updateRef(hash) {
  const headContentString = getHeadContentString(process.cwd());

  if (headContentString === null) return null;
  if (isDetachedHead(headContentString)) {
    const { pathToHeadRef } = getGudData()
    fs.writeFileSync(pathToHeadRef, hash + '\n');

    return;
  }

  const pathToCurrentHead = getHeadRefPath(headContentString);
  
  fs.writeFileSync(pathToCurrentHead, hash + '\n');
}

// updateRef('aaaa8fe5ccb19ba61c4c0873d391e987982fbbd3');