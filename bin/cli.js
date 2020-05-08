#!/usr/bin/env node

//
// Copyright 2020 DxOS.
//

const path = require('path');
const yargs = require('yargs');

const { run, readWebpackConfig } = require('..');

const argv = yargs
  .usage('$0 <file> [options] [-- puppeteerOptions]', 'runs the script', (yargs) => {
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
  await run({
    src: path.resolve(argv.file),
    watch: argv.watch,
    userConfig: await readWebpackConfig(argv.config),
    port: argv.port,
    env: argv.env,
    puppeteerOptions: argv._.length > 0 && yargs.parse(argv._)
  });
})();
