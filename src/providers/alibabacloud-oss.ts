import fs from 'fs';
import path from 'path';

import OSSClient from 'ali-oss';

import { IStorageOptions } from '../storage.js';

function parseConfig(remoteURIText: string): {
  endpoint: string;
  regionId: string;
  bucketName: string;
  objectPathPrefix: string;
} {
  const remoteURI = new URL(remoteURIText);
  const endpoint = remoteURI.host;
  const regionId = endpoint.split('.')[0];
  const remoteURIPaths = remoteURI.pathname.split('/').filter(Boolean);
  const bucketName = remoteURIPaths[0];
  const objectPathPrefix = remoteURIPaths.slice(1).join('/');
  return {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix
  };
}

async function pullObject(options: IStorageOptions): Promise<string> {
  const { fileName, localDir, remoteURI, credential = {} } = options;
  const {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix
  } = parseConfig(remoteURI);
  const {
    accessKeyId,
    accessKeySecret,
    securityToken
  } = credential;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('accessKeyId or accessKeySecret required');
  }
  const ossClient = new OSSClient({
    region: regionId,
    endpoint: `https://${endpoint}`,
    accessKeyId,
    accessKeySecret,
    stsToken: securityToken,
    bucket: bucketName
  });
  const remoteFilePath = path.join(objectPathPrefix, fileName);
  const localFilePath = path.join(localDir, fileName);
  const response = await ossClient.get(remoteFilePath, localFilePath);
  console.log('=> [pullObject] cloud response', response);
  return localFilePath;
}

async function pushObject(options: IStorageOptions): Promise<string> {
  const { fileName, localDir, remoteURI, credential = {} } = options;
  const {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix
  } = parseConfig(remoteURI);
  const {
    accessKeyId,
    accessKeySecret,
    securityToken
  } = credential;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('accessKeyId or accessKeySecret required');
  }
  const ossClient = new OSSClient({
    region: regionId,
    endpoint: `https://${endpoint}`,
    accessKeyId,
    accessKeySecret,
    stsToken: securityToken,
    bucket: bucketName
  });
  const remoteFilePath = path.join(objectPathPrefix, fileName);
  const localFilePath = path.join(localDir, fileName);
  const fileStream = fs.createReadStream(localFilePath);
  const response = await ossClient.putStream(remoteFilePath, fileStream);
  console.log('=> [pushObject] cloud response', response);
  return localFilePath;
}

export default {
  pullObject,
  pushObject
};
