import crypto from 'node:crypto';

export default function hashContent(content) {
  const header = createBlobHeader(content.length);
  const separator = Buffer.from('\0');
  const blob = Buffer.concat([header, separator, content]);

  const hash = crypto.createHash('sha1').update(blob).digest('hex');

  return hash;
}

export function createBlobHeader(contentSize) {
  const type = Buffer.from('blob ');
  const size = Buffer.from(String(contentSize));

  return Buffer.concat([type, size]);
}

// const buffer = Buffer.from('hello world\n');
// hashContent(buffer);