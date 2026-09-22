import fs from 'node:fs';
import path from 'node:path';
// import { getPathToGud } from './pathToGud.js';

export default function readHead(root = process.cwd()) {
  const headContentString = getHeadContentString(root);
  if (headContentString === null) return null;
  if (isDetachedHead(headContentString)) return headContentString.trim();

  const pathToCurrentHead = getHeadRefPath(headContentString, root);

  if (!fs.existsSync(pathToCurrentHead)) return null;

  return fs.readFileSync(pathToCurrentHead, 'utf8').trim();
}

export function getHeadContentString(root = process.cwd()) {
  const pathToHeadRef = path.join(root, '.gud', 'HEAD');
  if (!fs.existsSync(pathToHeadRef)) return null;
  const HEAD = fs.readFileSync(pathToHeadRef, 'utf8');

  return HEAD;
}

function isDetachedHead(headString) {
  return !headString.startsWith('ref: ');
}

export function getPathToCurrentHead() {
  const HEAD = getHeadContentString();
  if (HEAD === null) return null;
  if (isDetachedHead(HEAD)) return null;
  
  const pathToCurrentHead = getHeadRefPath(HEAD);

  return pathToCurrentHead;
}

function getHeadRefPath(head, root = process.cwd()) {
  return path.join(root, '.gud', head.split(" ")[1].trim());
}
// console.log(readPathToHead());
// console.log(readHead());