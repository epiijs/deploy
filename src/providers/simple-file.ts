import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { IStorageOptions } from '../storage.js';

function getRemoteDir(remoteURI: string): string {
  const remoteURIRest = remoteURI.split('://')[1];
  if (remoteURIRest.includes('./')) {
    throw new Error(`invalid options.remoteURI, relative path not supported`);
  }
  const remoteDir = remoteURIRest.replace('~', os.homedir());
  return remoteDir;
}

async function pullObject(options: IStorageOptions): Promise<string> {
  const { fileName, localDir, remoteURI } = options;
  const localFilePath = path.join(localDir, fileName);
  const remoteDir = getRemoteDir(remoteURI);
  const remoteFilePath = path.join(remoteDir, fileName);
  await fs.copyFile(remoteFilePath, localFilePath);
  return localFilePath;
}

async function pushObject(options: IStorageOptions): Promise<string> {
  const { fileName, localDir, remoteURI } = options;
  const localFilePath = path.join(localDir, fileName);
  const remoteDir = getRemoteDir(remoteURI);
  const remoteFilePath = path.join(remoteDir, fileName);
  await fs.mkdir(remoteDir, { recursive: true });
  await fs.copyFile(localFilePath, remoteFilePath);
  return remoteFilePath;
}

export default {
  pullObject,
  pushObject
};
