import fs from 'node:fs';
import path from 'path';

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

function createNestedDirectories(root, dirs) {
  const objectsPath = path.join(root, ...dirs);
  fs.mkdirSync(objectsPath, { recursive: true });
}

function repoStructureIntact(pathToRepo) {
  const gudRepoExists = fs.existsSync(pathToRepo);
  const objectsDirExists = fs.existsSync(path.join(pathToRepo, 'objects'));
  const refsDirExists = fs.existsSync(path.join(pathToRepo, 'refs', 'heads'));
  const HEADexists = fs.existsSync(path.join(pathToRepo, 'HEAD'));

  return gudRepoIntact && objectsDirIntact && refsDirIntact && HEADexists;
}