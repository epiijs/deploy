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

interface IPackageDeploy {
  remote: string;
  bundle: 'default' | 'never';
  secret: {
    [key: string]: string | undefined;
  };
  ignore: string[];
}

interface IPackageConfigInput {
  name: string;
  version: string;
  deploy: string;
}

interface IPackageConfig {
  // follow npm definition
  name: string;
  version: string;

  // @epiijs/deploy
  root: string;
  hash?: string;
  deploy: IPackageDeploy;
}

function buildPackageFileName(config: Pick<IPackageConfig, 'name' | 'version'>): string {
  return `${config.name.replace('/', '-')}@${config.version}.tar.gz`;
}

async function importPackageDeploy(config: {
  root: string;
  deploy: string;
}): Promise<IPackageDeploy> {
  const deployFileName = config.deploy;
  const deployFilePath = `${config.root}/${deployFileName}`;
  const deployFileContent = await fs.readFile(deployFilePath, 'utf8').catch(error => {
    console.error(error);
    throw new Error(`failed to read ${deployFilePath}`);
  });
  const maybeDeploy = tryParseJSON(deployFileContent) as Partial<IPackageDeploy> | undefined;
  if (!maybeDeploy) {
    throw new Error(`invalid ${deployFileName}, json format required`);
  }
  const maybeSecret = maybeDeploy.secret;
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
  const maybeIgnore = maybeDeploy.ignore || [];
  ['package.json', 'package.deploy.json'].forEach(e => {
    if (!maybeIgnore.includes(e)) {
      maybeIgnore.push(e);
    }
  });
  maybeDeploy.ignore = maybeIgnore;
  console.log('=> [importDeploy]', deployFileName);
  return maybeDeploy as IPackageDeploy;
}

async function importPackageConfig(root: string): Promise<IPackageConfig> {
  const configFileName = 'package.json';
  const configFilePath = `${root}/${configFileName}`;
  const configFileContent = await fs.readFile(configFilePath, 'utf8').catch(error => {
    console.error(error);
    throw new Error(`failed to read ${configFilePath}`);
  });
  const inputConfig = tryParseJSON(configFileContent) as IPackageConfigInput | undefined;
  if (!inputConfig) {
    throw new Error(`invalid ${configFileName}, json format required`);
  }
  const checkConfigProperty = (key: keyof IPackageConfigInput, value?: string): void => {
    if (!inputConfig[key]) {
      if (value) {
        inputConfig[key] = value;
      } else {
        throw new Error(`invalid ${configFileName}, ${key} required`);
      }
    }
  };
  checkConfigProperty('name');
  checkConfigProperty('version');
  checkConfigProperty('deploy', 'package.deploy.json');

  const deploy = await importPackageDeploy({ root, deploy: inputConfig.deploy });
  const maybeConfig: IPackageConfig = {
    name: inputConfig.name,
    version: inputConfig.version,
    root,
    deploy
  };
  console.log('=> [importConfig]', maybeConfig.name, maybeConfig.version);
  return maybeConfig;
}

async function archiveTAR({ tarFile, fileDir, ignore }: {
  tarFile: string;
  fileDir: string;
  ignore: string[];
}): Promise<void> {
  const files = await glob('**/*', { cwd: fileDir, ignore });
  await tar.create({ file: tarFile, gzip: true, cwd: fileDir }, files);
  const stat = await fs.stat(tarFile).catch(error => {
    console.error(error);
    return undefined;
  });
  console.log('=> [archiveTAR]', tarFile, stat?.size);
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
  importPackageDeploy,
  archiveTAR,
  extractTAR
};

export type {
  IPackageConfig,
  IPackageDeploy
};
