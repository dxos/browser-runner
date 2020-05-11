//
// Copyright 2020 DxOS.
//

import webpack from 'webpack';
import handler from 'serve-handler';
import http from 'http';
import puppeteer from 'puppeteer';

import { mergeWebpackConfig } from './webpack-config';
import { downloadBrowser } from './download-browser';

async function createServer (outputPath, port) {
  const server = http.createServer((request, response) => {
    return handler(request, response, { public: outputPath });
  });

  await new Promise(resolve => server.listen(port, () => {
    resolve();
  }));

  return server;
}

export async function run (options = {}) {
  const { port = 0, watch, puppeteerOptions = {} } = options;

  const config = await mergeWebpackConfig(options);
  const server = await createServer(config.output.path, port);
  const url = `http://localhost:${server.address().port}`;

  let browser;
  let page;

  try {
    await downloadBrowser(puppeteerOptions);
    browser = await puppeteer.launch(puppeteerOptions);
    page = await browser.newPage();
  } catch (err) {
    console.error(err);
    shutdown(1);
  }

  page.on('error', async err => {
    console.error(err);
    shutdown(1);
  });

  page.on('pageerror', async err => {
    console.error('pageerror', err);
    if (!watch) shutdown(1);
  });

  page.on('console', msg => {
    let text = msg.text();
    if (Array.isArray(text)) {
      text = text.join(' ');
    }

    console.log(text);
  });

  if (watch) {
    console.log(`Running on: ${url}\n\n`);
  } else {
    page
      .waitForFunction('window.exit !== undefined')
      .then(() => {
        return page.evaluate(() => {
          return window.exit;
        });
      })
      .then(code => {
        shutdown(code);
      })
      .catch(err => {
        console.error(err);
        shutdown(1);
      });
  }

  let firstRun = true;

  webpack(config, (err, stats) => {
    if (err) {
      console.error(err);
      shutdown(1);
      return;
    }

    if (stats.hasErrors()) {
      console.error(`${stats.toString({ chunks: false, colors: true })}`);
      if (!watch) shutdown(1);
      return;
    }

    if (firstRun) {
      firstRun = false;
      page.goto(url).catch(err => {
        console.error(err);
        shutdown(1);
      });
    } else {
      page.reload().catch(err => {
        console.error(err);
        shutdown(1);
      });
    }
  });

  async function shutdown (code = 0) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    process.exit(code);
  }
}
