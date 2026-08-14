import fs from 'node:fs';
import path from 'node:path';

export default function repoStructureIntact(pathToRepo) {
  const gudRepoExists = fs.existsSync(pathToRepo);
  const objectsDirExists = fs.existsSync(path.join(pathToRepo, 'objects'));
  const refsDirExists = fs.existsSync(path.join(pathToRepo, 'refs', 'heads'));
  const HEADexists = fs.existsSync(path.join(pathToRepo, 'HEAD'));

  return gudRepoExists && objectsDirExists && refsDirExists && HEADexists;
}