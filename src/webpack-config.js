//
// Copyright 2020 DxOS.
//

import { promises as fs } from 'fs';
import path from 'path';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import tempy from 'tempy';

const resolve = async (file) => {
  try {
    const fullpath = path.resolve(file);
    await fs.access(fullpath, fs.constants.F_OK);
    return fullpath;
  } catch (err) {
    return false;
  }
};

export async function readWebpackConfig (configPath = 'webpack.config.js') {
  const result = await resolve(configPath);
  if (!result) {
    return;
  }

  return require(result);
}

export async function mergeWebpackConfig (options) {
  const { src = './src/index.js', env = './.env', watch = false, userConfig = {} } = options;

  const envPath = (await resolve(env) || path.resolve(__dirname, '../.env.example'));

  return {
    mode: 'development',
    entry: {
      app: src
    },
    watch,
    stats: 'errors-warnings',
    devtool: 'inline-source-map',
    node: userConfig.node,
    plugins: [
      new Dotenv({
        path: envPath,
        systemvars: true
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
      ...(userConfig.plugins || [])
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

        ...(userConfig.module && userConfig.module.rules ? userConfig.module.rules : [])
      ]
    },
    output: {
      filename: '[name].bundle.js',
      path: tempy.directory()
    }
  };
}
