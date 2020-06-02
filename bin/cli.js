#!/usr/bin/env node

//
// Copyright 2020 DxOS.
//

const path = require('path');
const yargs = require('yargs');

const { run, readConfig } = require('..');

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
          describe: 'Browser runner config',
          type: 'string',
          default: 'browser-runner.config.js'
        },
        watch: {
          alias: 'w',
          describe: 'watch',
          type: 'boolean'
        },
        timeout: {
          describe: 'timeout for the script',
          type: 'number',
          default: 30000
        },
        port: {
          alias: 'p',
          describe: 'port to run',
          type: 'number'
        },
        webpackConfig: {
          describe: 'webpack config',
          type: 'string',
          default: 'webpack-config.js'
        },
        env: {
          describe: 'env file',
          type: 'string'
        }
      });
  })
  .argv;

(async () => {
  const { file, config: configPath, watch, timeout, port, env, webpackConfig, ...puppeteerOptions } = argv;

  const config = await readConfig(configPath);

  let options = {
    src: path.resolve(file),
    watch,
    timeout,
    webpackConfig: await readConfig(webpackConfig),
    port,
    env,
    puppeteerOptions
  };

  if (config) {
    options = {
      ...options,
      ...config
    };
  }

  await run(options);
})();
