//
// Copyright 2020 DxOS.
//

import { promises as fs, constants } from 'fs';
import path from 'path';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import InjectPlugin from 'webpack-inject-plugin';
import tempy from 'tempy';

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
  const { src = './src/index.js', env = './.env', watch = false, webpackConfig = {} } = options;

  const envPath = (await resolve(env) || path.resolve(__dirname, '../.env.default'));

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
    plugins: [
      new Dotenv({
        path: envPath,
        systemvars: true
      }),
      new InjectPlugin(() => {
        return `
        if (!window.process) {
          window.process = process || {}
        }

        window.process.exit = (code = 0) => {
          window.exit = code
        }
        `;
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
