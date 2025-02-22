import { readFile } from 'fs/promises';

import { glob } from 'glob';
import * as tar from 'tar';

interface IPackageConfig {
  // follow npm definition
  name: string;
  version: string;
  files?: string[];
  dependencies?: Record<string, string>;
  // @epiijs/deploy
  root: string;
  conn: string;
  hash?: string;
}

function tryParseJSON(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function importPackageConfig(target: string): Promise<IPackageConfig> {
  const root = target;
  const configFile = `${root}/package.json`;
  const configFileContent = await readFile(configFile, 'utf8').catch(error => {
    console.error(error);
    throw new Error(`failed to read ${configFile}`);
  });
  const maybeConfig = tryParseJSON(configFileContent) as Partial<IPackageConfig> | undefined;
  if (!maybeConfig) {
    throw new Error(`invalid package.json, json format required`);
  }
  const checkConfigProperty = (key: keyof IPackageConfig): void => {
    if (!maybeConfig[key]) {
      throw new Error(`invalid package.json, ${key} required`);
    }
  };
  checkConfigProperty('name');
  checkConfigProperty('version');
  checkConfigProperty('conn');
  maybeConfig.root = root;
  return maybeConfig as IPackageConfig;
}

function buildPackageFileName(config: Pick<IPackageConfig, 'name' | 'version'>): string {
  return `${config.name}@${config.version}.tar.gz`;
}

async function archiveTAR({ tarFile, fileDir }: {
  tarFile: string;
  fileDir: string;
}): Promise<void> {
  const files = await glob('**/*', { cwd: fileDir});
  await tar.create({ file: tarFile, gzip: true, cwd: fileDir }, files);
  console.log('=> [archiveTAR]', tarFile);
}

async function extractTAR({ tarFile, fileDir }: {
  tarFile: string;
  fileDir: string;
}): Promise<void> {
  await tar.extract({ file: tarFile, gzip: true, cwd: fileDir });
  console.log('=> [extractTAR]', fileDir);
}

export {
  buildPackageFileName,
  importPackageConfig,
  archiveTAR,
  extractTAR
};

export type {
  IPackageConfig
};
