#!/usr/bin/env node

//
// Copyright 2020 DxOS.
//

const path = require('path');
const yargs = require('yargs');

const { run, readWebpackConfig } = require('..');

const argv = yargs
  .usage('$0 <file> [options] [puppeteerOptions]', 'runs the script', (yargs) => {
    yargs
      .positional('file', {
        describe: 'the file to run',
        type: 'string'
      })
      .options({
        config: {
          alias: 'c',
          describe: 'webpack config',
          type: 'string'
        },
        watch: {
          alias: 'w',
          describe: 'watch',
          type: 'boolean'
        },
        port: {
          alias: 'p',
          describe: 'port to run',
          type: 'number'
        },
        env: {
          describe: 'env file',
          type: 'string'
        }
      });
  })
  .argv;

(async () => {
  const { file, watch, port, env, config, ...puppeteerOptions } = argv;

  await run({
    src: path.resolve(file),
    watch,
    userConfig: await readWebpackConfig(config),
    port,
    env,
    puppeteerOptions
  });
})();
