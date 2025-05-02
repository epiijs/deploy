import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  importPackageSecret,
  IPackageConfig,
  IPackageSecret
} from './package.js';

async function readyPackageCacheDir(): Promise<string> {
  const packageCacheDir = path.join(os.homedir(), '.epii-deploy-cache');
  await fs.mkdir(packageCacheDir, { recursive: true }).catch(error => {
    console.error('readyPackageCacheDir', error);
  });
  return packageCacheDir;
}

interface IStorageOptions {
  fileName: string;
  fileHash?: string;
  localDir: string;
  remoteURI: string;
  credential?: IPackageSecret;
}

interface IStorageProvider {
  pullObject: (options: IStorageOptions) => Promise<string>;
  pushObject: (options: IStorageOptions) => Promise<void>;
}

interface IStorageBridge {
  getLocalFilePath: (fileName: string) => string;
  pullObject: (options: Pick<IStorageOptions, 'fileName' | 'fileHash'>) => Promise<string>;
  pushObject: (options: Pick<IStorageOptions, 'fileName' | 'fileHash'>) => Promise<void>;
}

const StorageProviderSchemeAlias: Record<string, string> = {
  file: 'simple-file',
  aws: 'aws-s3',
  s3: 'aws-s3',
  aliyun: 'alibabacloud-oss',
  alibabacloud: 'alibabacloud-oss',
  oss: 'alibabacloud-oss'
};

async function createStorageBridge(config: Pick<IPackageConfig, 'root' | 'remote' | 'secret'>): Promise<IStorageBridge> {
  // ready package cache dir as local dir
  const localDir = await readyPackageCacheDir();

  // parse config.remote and import storage provider
  const [scheme] = config.remote.split('://');
  const providerName = StorageProviderSchemeAlias[scheme] || scheme;
  if (!providerName) {
    throw new Error(`invalid remote, scheme [${scheme}] not supported`);
  }
  // TODO: support custom provider future
  const provider: IStorageProvider = (await import(`./providers/${providerName}.js`)).default;

  // parse config.secret and import storage credential
  const secretless = scheme === 'file';
  const packageSecret = secretless ? undefined : await importPackageSecret(config);

  return {
    getLocalFilePath: (fileName: string): string => {
      return path.join(localDir, fileName);
    },

    // pull object from remote storage to local cache
    pullObject: async ({ fileName, fileHash }): Promise<string> => {
      const cacheFilePath = await provider.pullObject({
        fileName,
        fileHash,
        localDir,
        remoteURI: config.remote,
        credential: packageSecret
      });
      console.log('=> [pullObject]');
      return cacheFilePath;
    },

    // push object from local cache to remote storage
    pushObject: async ({ fileName, fileHash }) => {
      await provider.pushObject({
        fileName,
        fileHash,
        localDir,
        remoteURI: config.remote,
        credential: packageSecret
      });
      console.log('=> [pushObject]');
    }
  };
}

export {
  readyPackageCacheDir,
  createStorageBridge
};

export type {
  IStorageOptions,
  IStorageProvider
};