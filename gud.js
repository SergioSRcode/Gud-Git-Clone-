import init from './init.js';
import add from './add.js';
import commit from './commit.js';
import log from './log.js';
import path from 'path';

const args = process.argv.slice(2);

function runGud(args) {
  const command = args[0];

  switch(command) {
    case 'init':
      init();
      break;

    case 'add':
      add(args[1]);
      break;

    case 'commit': {  // a block so const stays local to the case
      const message = args[1];
      if (!message) {
        console.log('commit message required');
        break;
      }
      commit(message);
      break;
    }

    case 'log':
      log();
      break;

    default:
      console.error("Sorry, that command is not supported");
  }
}

runGud(args);