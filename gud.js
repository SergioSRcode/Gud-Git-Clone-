import init from './init.js';
import add from './add.js';
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

    default:
      console.error("Sorry, that command is not supported");
  }
}

runGud(args);