import fs from 'node:fs';
import path from 'node:path';
import { getPathToGud } from './pathToGud.js';
import readHead from './readHead.js';

// name is a simple branch name, eg. 'test' 
// hierarchical branch names are not supported (e.g. 'test/login')
// existence check is applied here
export default function createBranch(name) {
  if (!name) {
    console.error("Branch name after '-b' is required");
    return false;
  }

  const currentCommitHash = readHead();
  if (!currentCommitHash) {
    console.log('fatal: initial commit required for branch creation.');
    return false;
  }

  const newBranchPath = path.join(getPathToGud(), 'refs', 'heads', name);
  if (fs.existsSync(newBranchPath)) {
    console.error(`fatal: a branch named ${name} already exists`);
    return false;
  }

  fs.writeFileSync(newBranchPath, currentCommitHash + '\n');
  return true;
}

// createBranch('main');