import readHead from "./readHead.js";
import { parseCommit } from "./commit.js";

export default function log(commitHash = readHead()) {
  const commit = parseCommit(commitHash);
  if (commit === null) return;

  const { author, parents, message } = commit;
  
  console.log(`\ncommit ${commitHash}\n${author}\n\n    ${message}`);

  if (parents.length === 0) return;

  log(parents[0]);
}

// log();