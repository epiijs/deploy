import performInstall from './handlers/install.js';
import performPublish from './handlers/publish.js';

async function install(): Promise<void> {
  await performInstall();
}

async function publish(): Promise<void> {
  await performPublish();
}

export {
  install,
  publish
};
