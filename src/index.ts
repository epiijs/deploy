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
  const packageFilePath = await storageBridge.pullObject({
    fileName: packageFileName,
    fileHash: packageConfig.hash
  });
  await extractTAR({
    tarFile: packageFilePath,
    fileDir: packageConfig.root
  });
}

async function publish(target: string | IPackageConfig): Promise<void> {
  const packageConfig = typeof target === 'string' ? await importPackageConfig(target) : target;
  const storageBridge = await createStorageBridge(packageConfig);
  const packageFileName = buildPackageFileName(packageConfig);
  const packageFilePath = storageBridge.getLocalFilePath(packageFileName);
  await archiveTAR({
    tarFile: packageFilePath,
    fileDir: packageConfig.root,
    ignore: packageConfig.deploy.ignore
  });
  await storageBridge.pushObject({
    fileName: packageFileName,
    fileHash: packageConfig.hash
  });
}

export {
  install,
  publish
};
