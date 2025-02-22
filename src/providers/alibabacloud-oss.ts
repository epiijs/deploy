import fs from 'fs/promises';
import path from 'path';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { IStorageOptions } from '../storage.js';

function parseConnForOSS(conn: string): {
  endpoint: string;
  regionId: string;
  bucketName: string;
  objectPathPrefix: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
} {
  const connURL = new URL('any://' + conn);
  const endpoint = connURL.host;
  const regionId = endpoint.split('.')[0];
  const connPaths = connURL.pathname.split('/').filter(Boolean);
  const bucketName = connPaths[0];
  const objectPathPrefix = connPaths.slice(1).join('/');
  const accessKeyId = connURL.searchParams.get('accessKeyId') || '';
  const accessKeySecret = connURL.searchParams.get('accessKeySecret') || '';
  const securityToken = connURL.searchParams.get('securityToken') || '';
  return {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix,
    accessKeyId,
    accessKeySecret,
    securityToken
  };
}

async function pullObject(options: IStorageOptions): Promise<string> {
  const { fileName, connRest, cacheDir } = options;
  const {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix,
    accessKeyId,
    accessKeySecret,
    securityToken
  } = parseConnForOSS(connRest);
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
  const localFilePath = path.join(cacheDir, fileName);
  await fs.writeFile(localFilePath, buffer);
  return localFilePath;
}

async function pushObject(options: IStorageOptions): Promise<string> {
  const { fileName, connRest, cacheDir } = options;
  const {
    endpoint,
    regionId,
    bucketName,
    objectPathPrefix,
    accessKeyId,
    accessKeySecret,
    securityToken
  } = parseConnForOSS(connRest);
  const localFilePath = path.join(cacheDir, fileName);
  const fileBuffer = await fs.readFile(localFilePath);
  const s3Client = new S3Client({
    region: regionId,
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret,
      sessionToken: securityToken
    }
  });
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
