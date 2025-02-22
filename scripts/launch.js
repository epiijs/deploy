#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import {
  install,
  publish
} from '../build/index.js';

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const target = path.resolve(args[1] || process.cwd());

  switch (action) {
    case 'install': {
      install(target);
      break;
    }
    case 'publish': {
      publish(target);
      break;
    }
    default: {
      const dirName = getDirNameByImportMeta(import.meta);
      const helpText = await fs.readFile(path.join(dirName, './help.txt'), 'utf-8');
      console.log(helpText);
      break;
    }
  }
}

main();