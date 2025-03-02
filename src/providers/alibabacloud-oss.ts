import fs from 'fs/promises';
import path from 'path';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { IStorageOptions } from '../storage.js';

function parseOSSConfig(remoteURIText: string): {
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
  } = parseOSSConfig(remoteURI);
  const {
    accessKeyId,
    accessKeySecret,
    securityToken
  } = credential;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('accessKeyId or accessKeySecret required');
  }
  const s3Client = new S3Client({
    region: regionId,
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret,
      sessionToken: securityToken
    }
  });
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: path.join(objectPathPrefix, fileName)
  });
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error('no response body');
  }
  const buffer = await response.Body.transformToByteArray();
  const localFilePath = path.join(localDir, fileName);
  await fs.writeFile(localFilePath, buffer);
  return localFilePath;
}

async function pushObject(options: IStorageOptions): Promise<string> {
  const { fileName, localDir, remoteURI, credential = {} } = options;
  const {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix
  } = parseOSSConfig(remoteURI);
  const {
    accessKeyId,
    accessKeySecret,
    securityToken
  } = credential;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('accessKeyId or accessKeySecret required');
  }
  const s3Client = new S3Client({
    region: regionId,
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret,
      sessionToken: securityToken
    }
  });
  const localFilePath = path.join(localDir, fileName);
  const fileBuffer = await fs.readFile(localFilePath);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: path.join(objectPathPrefix, fileName),
    Body: fileBuffer
  });
  const response = await s3Client.send(command);
  console.log('=> [pushObject] oss response', response);
  return localFilePath;
}

export default {
  pullObject,
  pushObject
};
