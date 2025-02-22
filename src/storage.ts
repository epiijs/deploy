import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { IPackageConfig } from './package.js';

interface IStorageOptions {
  fileName: string;
  fileHash?: string;
  connRest: string;
  cacheDir: string;
}

interface IStorageProvider {
  pullObject: (options: IStorageOptions) => Promise<string>;
  pushObject: (options: IStorageOptions) => Promise<void>;
}

interface IStorageBridge {
  getCacheDir: () => string;
  pullObject: (options: Pick<IStorageOptions, 'fileName' | 'fileHash'>) => Promise<string>;
  pushObject: (options: Pick<IStorageOptions, 'fileName' | 'fileHash'>) => Promise<void>;
}

async function readyPackageCacheDir(): Promise<string> {
  const packageCacheDir = path.join(os.homedir(), '.epii-deploy-cache');
  await fs.mkdir(packageCacheDir, { recursive: true }).catch(error => {
    console.error('readyPackageCacheDir', error);
  });
  return packageCacheDir;
}

const StorageProviderSchemeAlias: Record<string, string> = {
  file: 'simple-file',
  aws: 'aws-s3',
  s3: 'aws-s3',
  aliyun: 'alibabacloud-oss',
  alibabacloud: 'alibabacloud-oss',
  oss: 'alibabacloud-oss'
};

async function createStorageBridge(config: Pick<IPackageConfig, 'conn'>): Promise<IStorageBridge> {
  const packageCacheDir = await readyPackageCacheDir();
  const [scheme, connRest] = config.conn.split('://');
  const providerName = StorageProviderSchemeAlias[scheme] || scheme;
  if (!providerName) {
    throw new Error(`invalid conn, scheme [${scheme}] not supported`);
  }
  // TODO: support custom provider future
  const provider: IStorageProvider = (await import(`./providers/${providerName}.js`)).default;
  return {
    // get cache dir
    getCacheDir: (): string => {
      return packageCacheDir;
    },

    // pull object from remote storage to local cache
    pullObject: async ({ fileName, fileHash }): Promise<string> => {
      const cacheFilePath = await provider.pullObject({
        fileName,
        fileHash,
        connRest,
        cacheDir: packageCacheDir
      });
      console.log('=> [pullObject]');
      return cacheFilePath;
    },

    // push object from local cache to remote storage
    pushObject: async ({ fileName, fileHash }) => {
      await provider.pushObject({
        fileName,
        fileHash,
        connRest,
        cacheDir: packageCacheDir
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