#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const arch = require('archiver');
const prettyBytes = require('pretty-bytes');

(async function pack() {
  const packageDesc = require('./package');
  const tarName = `ngageoint-mage.web-app.dist-${packageDesc.version}.tgz`
  const tarPath = path.join(__dirname, tarName);
  delete packageDesc.scripts;
  delete packageDesc.dependencies;
  delete packageDesc.devDependencies;
  const out = fs.createWriteStream(tarPath);
  const tar = arch('tar', { prefix: 'package/', gzip: true });
  let unpackedSize = 0;
  tar.on('entry', entry => {
    unpackedSize += entry.size;
    console.log(`${prettyBytes(entry.stats.size || 0).padStart(8, ' ')} ${entry.name}`);
  });
  tar.pipe(out);
  tar.append(JSON.stringify(packageDesc, null, 2), { name: 'package/package.json' });
  tar.directory('dist', 'package/dist/');
  await tar.finalize();
  const stats = await fs.stat(tarPath);
  return { path: tarPath, unpackedSize, stats };
})().then(
  tar => {
    console.log(
      `\npacked dist tarball ${path.basename(tar.path)}\n` +
      `  - ${prettyBytes(tar.stats.size)} packed, ${prettyBytes(tar.unpackedSize)} unpacked\n`);
  },
  err => {
    console.log('error building dist tarball: ', err);
  });