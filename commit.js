import readIndex from "./readIndex.js";
import buildDirectoryStructure from "./buildDirectoryStructure.js";
import buildTree from "./buildTree.js";
import { storeObject } from "./writeObject.js";
import readHead from "./readHead.js";
import updateRef from "./updateRef.js";
import readObject from "./readObject.js";

export default function commit(message) {
  const index = readIndex();  // staged files as path-keyed obj
  if (Object.keys(index).length === 0) {
    console.log("Nothing to commit.");
    return;
  }

  const dirStructure = buildDirectoryStructure(index);
  // stores compressed tree objects to obj store for each nested dir
  // returns the root tree hash
  const rootTreeHash = buildTree(dirStructure);
  const parentCommitHash = readHead();  // null for first commit

  if (parentCommitHash && parseCommit(parentCommitHash).tree === rootTreeHash) {
    console.log("nothing to commit.");
    return;
  }

  const commitContentString = createCommitContent(rootTreeHash, parentCommitHash, message.trim());
  const commitBuffer = serializeContentStringToCommitObject(commitContentString);
  // stores compressed commit object to obj store
  // returns the commit objects hash
  const commitHash = storeObject(commitBuffer);
  
  updateRef(commitHash);
}

export function parseCommit(commitHash) {
  const contentBuffer = readObject(commitHash);
  if (!contentBuffer) return null;

  const contentString = contentBuffer.toString('utf8');
  const linesObj = {};
  const [headersStr, message] = contentString.split('\n\n');
  
  linesObj.message = message;
  
  headersStr.split('\n').forEach(line => {
    const firstSpaceIdx = line.indexOf(' ');
    const title = line.slice(0, firstSpaceIdx);
    const value = line.slice(firstSpaceIdx + 1);

    linesObj[title] = value;
  });

  if (!linesObj.parent) linesObj.parent = null;

  return linesObj;
}

function createCommitContent(rootHash, parentHash, message = 'no commit message') {
  const treeLine = `tree ${rootHash}`;
  const parentLine = parentHash ? `\nparent ${parentHash}` : '';
  const authorLine = `\nauthor gud user ${new Date().toISOString()}`;
  const blankline = '\n\n';
  const messageLine = message;

  const commitObjectContent = treeLine.concat(
    parentLine, 
    authorLine, 
    blankline, 
    messageLine
  );

  return commitObjectContent;
}

function serializeContentStringToCommitObject(contentString) {
  const content = Buffer.from(contentString);
  const header = Buffer.from("commit " + content.length + "\0");

  return Buffer.concat([header, content]);
}

// createCommitContent('aaaaaaaaaaa', 'bbbbbbb', 'working tessst');
// createCommitContent('aaaaaaaaaaa', null, 'working tessst');
// createCommitContent('aaaaaaaaaaa', 'bbbbbbb');
// createCommitContent('aaaaaaaaaaa', null);