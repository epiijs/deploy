#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const target = action !== 'help' ? args[1] || process.cwd() : '';

  switch (action) {
    case 'install': {
      console.log('install', target);
      // const {
      //   default: appConfig
      // } = await import('../build/config/index.js');
      // TODO: 
      break;
    }
    case 'publish': {
      console.log('publish', target);
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