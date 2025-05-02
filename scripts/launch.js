#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
      const dirname = path.dirname(fileURLToPath(import.meta.url));
      const packageJSON = JSON.parse(await fs.readFile(path.join(dirname, '../package.json'), 'utf-8'));
      const helpText = (await fs.readFile(path.join(dirname, './help.txt'), 'utf-8'))
        .replace('${version}', packageJSON.version);
      console.log(helpText);
      break;
    }
  }
}

main();