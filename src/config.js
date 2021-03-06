//
// Copyright 2020 DxOS.
//

import assert from 'assert';
import { promises as fs, constants, readFileSync } from 'fs';
import path from 'path';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import InjectPlugin from 'webpack-inject-plugin';
import tempy from 'tempy';
import { DefinePlugin } from 'webpack';

const resolve = async (file) => {
  try {
    const fullpath = path.resolve(file);
    await fs.access(fullpath, constants.F_OK);
    return fullpath;
  } catch (err) {
    return false;
  }
};

export async function readConfig (configPath) {
  const result = await resolve(configPath);
  if (!result) {
    return;
  }

  return require(result);
}

export async function mergeWebpackConfig (options) {
  const { src = './src/index.js', env = './.env', watch = false, webpackConfig = {}, argv = [], alias = [] } = options;

  const envPath = (await resolve(env) || path.resolve(__dirname, '../.env.default'));

  const aliasMap = alias.reduce((prev, curr) => {
    const [oldModule, newModule] = curr.split(':');
    assert(oldModule);
    assert(newModule);
    prev[oldModule] = newModule.startsWith('./') ? path.resolve(process.cwd(), newModule) : newModule;
    return prev;
  }, {});

  return {
    mode: 'development',
    entry: {
      app: src
    },
    watch,
    stats: 'errors-warnings',
    devtool: 'inline-source-map',
    node: webpackConfig.node || {
      fs: 'empty'
    },
    resolve: {
      alias: aliasMap
    },
    plugins: [
      new Dotenv({
        path: envPath,
        systemvars: true
      }),
      new InjectPlugin(() => readFileSync(require.resolve('./runtime'), { encoding: 'utf-8' })),
      new DefinePlugin({
        __process_argv: JSON.stringify(['browser-runner', src, ...argv])
      }),
      new HtmlWebpackPlugin({
        templateContent: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BrowserRunner</title>
            <link rel="icon" href="data:;base64,iVBORw0KGgo="/>
          </head>
          <body>
          </body>
          </html>
        `
      }),
      ...(webpackConfig.plugins || [])
    ].filter(Boolean),
    module: {
      rules: [
        // js
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: require.resolve('babel-loader')
          }
        },

        ...(webpackConfig.module && webpackConfig.module.rules ? webpackConfig.module.rules : [])
      ]
    },
    output: {
      filename: '[name].bundle.js',
      path: tempy.directory()
    }
  };
}
