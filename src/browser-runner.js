//
// Copyright 2020 DxOS.
//

import webpack from 'webpack';
import handler from 'serve-handler';
import http from 'http';
import puppeteer from 'puppeteer';

import { mergeWebpackConfig } from './config';
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

const noop = () => {};

export async function run (options = {}) {
  const { port = 0, watch, beforeAll = noop, afterAll = noop, onMessage = noop, puppeteerOptions = {} } = options;

  const webpackConfig = await mergeWebpackConfig(options);
  const server = await createServer(webpackConfig.output.path, port);
  const url = `http://localhost:${server.address().port}`;

  let browser;
  let page;

  try {
    await downloadBrowser(puppeteerOptions);
    browser = await puppeteer.launch(puppeteerOptions);
    page = await browser.newPage();
    await beforeAll({ options, shutdown });
  } catch (err) {
    shutdown(1, err);
  }

  page.on('error', err => {
    shutdown(1, err);
  });

  page.on('pageerror', err => {
    console.error('pageerror', err);
    if (!watch) shutdown(1);
  });

  page.on('console', msg => {
    let text = msg.text();
    if (Array.isArray(text)) {
      text = text.join(' ');
    }

    console.log(text);
    onMessage(text);
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
      .catch(() => {
        // ignore
      });
  }

  let firstRun = true;

  webpack(webpackConfig, (err, stats) => {
    if (err) {
      shutdown(1, err);
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
        shutdown(1, err);
      });
    } else {
      page.reload().catch(err => {
        shutdown(1, err);
      });
    }
  });

  async function shutdown (code = 0, err) {
    try {
      await afterAll(err);
    } catch (err) {
      console.error('afterAll error', err);
    }

    if (browser) {
      await browser.close().catch(() => {});
    }

    if (err) {
      console.error(err);
    }
    process.exit(code);
  }
}
