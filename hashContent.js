import crypto from 'node:crypto';
import { buildBlob } from './buildBlob.js';

export default function hashContent(content) {
  const blob = buildBlob(content);
  const hash = crypto.createHash('sha1').update(blob).digest('hex');

  return hash;
}

// const buffer = Buffer.from('hello world\n');
// console.log(hashContent(buffer));