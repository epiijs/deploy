import fs from 'fs/promises';

import { glob } from 'glob';
import * as tar from 'tar';

function tryParseJSON(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

interface IPackageConfig {
  // follow npm definition
  name: string;
  version: string;
  // @epiijs/deploy
  root: string;
  hash?: string;
  remote: string;
  secret: string;
}

interface IPackageSecret {
  [key: string]: string | undefined;
}

function buildPackageFileName(config: Pick<IPackageConfig, 'name' | 'version'>): string {
  return `${config.name}@${config.version}.tar.gz`;
}

async function importPackageConfig(root: string): Promise<IPackageConfig> {
  const configFileName = 'package.json';
  const configFilePath = `${root}/${configFileName}`;
  const configFileContent = await fs.readFile(configFilePath, 'utf8').catch(error => {
    console.error(error);
    throw new Error(`failed to read ${configFilePath}`);
  });
  const maybeConfig = tryParseJSON(configFileContent) as Partial<IPackageConfig> | undefined;
  if (!maybeConfig) {
    throw new Error(`invalid ${configFileName}, json format required`);
  }
  const checkConfigProperty = (key: keyof IPackageConfig, value?: string): void => {
    if (!maybeConfig[key]) {
      if (value) {
        maybeConfig[key] = value;
      } else {
        throw new Error(`invalid ${configFileName}, ${key} required`);
      }
    }
  };
  checkConfigProperty('name');
  checkConfigProperty('version');
  checkConfigProperty('remote');
  checkConfigProperty('secret', 'package.secret.json');
  maybeConfig.root = root;
  console.log('=> [importConfig]', maybeConfig.name, maybeConfig.version);
  return maybeConfig as IPackageConfig;
}

async function importPackageSecret(root: string, secret?: string): Promise<IPackageSecret> {
  const secretFileName = secret || 'package.secret.json';
  const secretFilePath = `${root}/${secretFileName}`;
  const secretFileContent = await fs.readFile(secretFilePath, 'utf8').catch(error => {
    console.error(error);
    throw new Error(`failed to read ${secretFilePath}`);
  });
  const maybeSecret = tryParseJSON(secretFileContent) as Partial<IPackageSecret> | undefined;
  if (!maybeSecret) {
    throw new Error(`invalid ${secretFileName}, json format required`);
  }
  for (const key in maybeSecret) {
    const value = maybeSecret[key];
    if (value?.startsWith('$')) {
      const envKey = value.slice(1);
      const envValue = process.env[envKey];
      if (envValue) {
        maybeSecret[key] = envValue;
      } else {
        throw new Error(`[${envKey}] not found, environment variable required`);
      }
    }
  }
  console.log('=> [importSecret]', secretFileName);
  return maybeSecret as IPackageSecret;
}

async function archiveTAR({ tarFile, fileDir, ignore }: {
  tarFile: string;
  fileDir: string;
  ignore: string[];
}): Promise<void> {
  const files = await glob('**/*', { cwd: fileDir, ignore });
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
  importPackageSecret,
  archiveTAR,
  extractTAR
};

export type {
  IPackageConfig,
  IPackageSecret
};
