import readHead from "./readHead.js";
import { parseCommit } from "./commit.js";

export default function log(commitHash = readHead()) {
  const commit = parseCommit(commitHash);
  if (commit === null) return;

  const { author, parent, message } = commit;
  
  console.log(`\ncommit ${commitHash}\n${author}\n\n    ${message}`);

  if (!parent) return;

  log(parent);
}

// log();