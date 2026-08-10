import path from 'node:path';
import fs from 'node:fs';

export function createNestedDirectories(root, dirs) {
  const objectsPath = path.join(root, ...dirs);
  fs.mkdirSync(objectsPath, { recursive: true });
}