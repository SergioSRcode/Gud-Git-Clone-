import fs from 'node:fs';
import path from 'node:path';
import { getPathToGud } from './pathToGud.js';

export default function readHead() {
  const pathToCurrentHead = getPathToCurrentHead();
  if (!fs.existsSync(pathToCurrentHead)) return null;

  return fs.readFileSync(pathToCurrentHead, 'utf8').trim();
}

export function getPathToCurrentHead() {
  const gudPath = getPathToGud();
  const pathToHeadRef = path.join(gudPath, 'HEAD');
  const HEAD = fs.readFileSync(pathToHeadRef, 'utf8');
  const pathToCurrentHead = path.join(gudPath, HEAD.split(" ")[1].trim());

  return pathToCurrentHead;
}

// console.log(readPathToHead());
// console.log(readHead());