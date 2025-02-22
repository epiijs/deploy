import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { IStorageOptions } from '../storage.js';

async function pullObject(options: IStorageOptions): Promise<string> {
  const { fileName, connRest, cacheDir } = options;
  if (connRest.includes('./')) {
    throw new Error(`invalid options.connRest, relative path not supported`);
  }
  const remoteFileDir = connRest.replace('~', os.homedir());
  const remoteFilePath = path.join(remoteFileDir, fileName);
  const localFilePath = path.join(cacheDir, fileName);
  await fs.copyFile(remoteFilePath, localFilePath);
  return localFilePath;
}

async function pushObject(options: IStorageOptions): Promise<string> {
  const { fileName, connRest, cacheDir } = options;
  if (connRest.includes('./')) {
    throw new Error(`invalid options.connRest, relative path not supported`);
  }
  const remoteFileDir = connRest.replace('~', os.homedir());
  const remoteFilePath = path.join(remoteFileDir, fileName);
  const localFilePath = path.join(cacheDir, fileName);
  await fs.mkdir(remoteFileDir, { recursive: true });
  await fs.copyFile(localFilePath, remoteFilePath);
  return remoteFilePath;
}

export default {
  pullObject,
  pushObject
};
