import readObject from "./readObject.js";
import readHead from "./readHead.js";

/*
data context: objBuffer is parsed to a utf8 string that looks like this:

tree <hash>\n
parent <hash>\n
author <name> <timestamp>\n
\n
<message>

*/

export default function log(commitHash = readHead()) {
  const objBuffer = readObject(commitHash);
  if (objBuffer === null) return;
  const stringContent = objBuffer.toString('utf8');

  const lines = stringContent.split('\n');
  const parent = lines.find(line => line.startsWith('parent '));
  const author = lines.find(line => line.startsWith('author '));
  const message = lines.slice(lines.indexOf('') + 1).join('\n');
  
  console.log(`\ncommit ${commitHash}\n${author}\n\n    ${message}`);

  if (!parent) return;

  const parentHash = parent.split(" ")[1];
  log(parentHash);
}

log();