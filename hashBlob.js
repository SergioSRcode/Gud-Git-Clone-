import crypto from 'node:crypto';
// function also works with trees, renaming should be considered
export default function hashBlob(blob) {
  return crypto.createHash('sha1').update(blob).digest('hex');
}

// const buffer = Buffer.from('hello world\n');
// console.log(hashContent(buffer));