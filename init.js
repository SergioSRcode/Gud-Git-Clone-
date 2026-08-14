import fs from 'node:fs';
import path from 'path';
import { createNestedDirectories } from './createNestedDirectories.js';
import repoStructureIntact from './repoStructureIntact.js';

export default function init() {
  const root = process.cwd();
  const gudPath = path.join(root, '.gud');

  if (repoStructureIntact(gudPath)) {
    console.error('Gud Repository already created');
    return;
  }
  
  createNestedDirectories(gudPath, ['objects']);
  createNestedDirectories(gudPath, ['refs', 'heads']);

  const headPath = path.join(gudPath, 'HEAD');
  fs.writeFileSync(headPath, 'ref: refs/heads/main\n');

  console.log(`Gud Repository created at ${gudPath}.`);
}