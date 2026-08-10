function createBlobHeader(contentSize) {
  const type = Buffer.from('blob ');
  const size = Buffer.from(String(contentSize));

  return Buffer.concat([type, size]);
}

export function buildBlob(content) {
  const header = createBlobHeader(content.length);
  const separator = Buffer.from('\0');
  const blob = Buffer.concat([header, separator, content]);

  return blob;
}