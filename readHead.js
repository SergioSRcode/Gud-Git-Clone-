import fs from 'node:fs';
import path from 'node:path';
import { getPathToGud } from './pathToGud.js';

export default function readHead() {
  const headContentString = getHeadContentString();
  if (isDetachedHead(headContentString)) return headContentString.trim();

  const pathToCurrentHead = getHeadRefPath(headContentString);

  if (!fs.existsSync(pathToCurrentHead)) return null;

  return fs.readFileSync(pathToCurrentHead, 'utf8').trim();
}

export function getHeadContentString() {
  const pathToHeadRef = path.join(getPathToGud(), 'HEAD');
  const HEAD = fs.readFileSync(pathToHeadRef, 'utf8');

  return HEAD;
}

function isDetachedHead(headString) {
  return !headString.startsWith('ref: ');
}

export function getPathToCurrentHead() {
  const HEAD = getHeadContentString();
  if (isDetachedHead(HEAD)) return null;
  
  const pathToCurrentHead = getHeadRefPath(HEAD);

  return pathToCurrentHead;
}

function getHeadRefPath(head) {
  return path.join(getPathToGud(), head.split(" ")[1].trim());
}
// console.log(readPathToHead());
// console.log(readHead());