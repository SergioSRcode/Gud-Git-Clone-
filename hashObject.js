import crypto from 'node:crypto';
// function also works with trees, renaming should be considered
export default function hashObject(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

// const buffer = Buffer.from('hello world\n');
// console.log(hashContent(buffer));