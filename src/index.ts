import path from 'path';

import {
  importPackageConfig,
  buildPackageFileName,
  archiveTAR,
  extractTAR,
  IPackageConfig
} from './package.js';
import {
  createStorageBridge
} from './storage.js';

async function install(target: string | IPackageConfig): Promise<void> {
  const packageConfig = typeof target === 'string' ? await importPackageConfig(target) : target;
  const storageBridge = await createStorageBridge(packageConfig);
  const packageFileName = buildPackageFileName(packageConfig);
  const packageCacheFilePath = await storageBridge.pullObject({
    fileName: packageFileName,
    fileHash: packageConfig.hash
  });
  await extractTAR({
    tarFile: packageCacheFilePath,
    fileDir: packageConfig.root
  });
  // TODO: merge package.json instead of overwrite
  // TODO: merge dependencies to parent package.json
}

async function publish(target: string | IPackageConfig): Promise<void> {
  const packageConfig = typeof target === 'string' ? await importPackageConfig(target) : target;
  const packageFileName = buildPackageFileName(packageConfig);
  const storageBridge = await createStorageBridge(packageConfig);
  await archiveTAR({
    tarFile: path.join(storageBridge.getCacheDir(), packageFileName),
    fileDir: packageConfig.root
  });
  await storageBridge.pushObject({
    fileName: packageFileName
  });
}

export {
  install,
  publish
};
