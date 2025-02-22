# @epiijs/deploy

A toolkit for deploying any packages anywhere.

`npm` private plan or running your own npm registry is complex and expensive. 

`@epiijs/deploy` will allow you to publish or install packages to or from any storages.

Of course you can use Alibaba Cloud or AWS S3 as your own storage provider.
`WIP`

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
  "name": "your-own",
  "files": [
    "your-package/**/*"
  ],
  "seed": "your-storage-conn",
  "hash": "your-package-hash"
}
```

## Install / Publish by CLI

```Bash
epii-deploy install
epii-deploy install [your-package-path]

epii-deploy publish
epii-deploy publish [your-package-path]
```