# @epiijs/deploy

A toolkit for deploying any packages anywhere.

`npm` private plan or running your own npm registry is complex and expensive. 

`@epiijs/deploy` will allow you to publish or install packages to or from any storages.

Of course you can use Alibaba Cloud or AWS S3 (WIP) as your own storage provider.

# Install

```bash
npm intall --save-dev @epiijs/deploy 
# OR
npm install --global @epiijs/deploy
```

# Usage

## Prepare

You need a directory with a `package.json` at least.

```JSON
{
  "name": "any-package-name",
  "version": "any-package-version",
  "remote": "your-remote-storage",
  "hash": "this-package-hash-but-not-support-yet"
}
```

## Install / Publish by CLI

```Bash
epii-deploy install
epii-deploy install [your-package-path]

epii-deploy publish
epii-deploy publish [your-package-path]
```

## Remote URI

```Bash
simple-file
file://your-path-to-package-dir

alibabacloud-oss
oss://endpoint/bucket/object-path-prefix
```

## Secret

You should keep your credential in KMS services or temp memory like ENV instead of Git repository. 

To use ENV keep secret, you can create a secret file `package.secret.json`.

```JSON
{
  "accessKeyId": "$YOUR_ACCESS_KEY_ID_ENV_NAME",
  "accessKeySecret": "$YOUR_ACCESS_KEY_SECRET_ENV_NAME"
}
```

And then set ENV while using CLI.

```Bash
YOUR_ACCESS_KEY_ID_ENV_NAME=X YOUR_ACCESS_KEY_SECRET_ENV_NAME=Y epii-deploy what-you-want-to-do
```