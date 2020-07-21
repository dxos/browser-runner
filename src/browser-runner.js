//
// Copyright 2020 DxOS.
//

import webpack from 'webpack';
import handler from 'serve-handler';
import http from 'http';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';

import { mergeWebpackConfig } from './config';
import { downloadBrowser } from './download-browser';
import { EventEmitter } from 'events';

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
  const {
    port = 0,
    watch,
    timeout = 30 * 1000,
    beforeAll = noop,
    afterAll = noop,
    onExecute = noop,
    onMessage = noop,
    puppeteerOptions = {},
    log = console.log,
    processExit = true
  } = options;

  const webpackConfig = await mergeWebpackConfig(options);
  const server = await createServer(webpackConfig.output.path, port);
  const url = `http://localhost:${server.address().port}`;

  let browser = null;
  let page = null;
  let watcher = null;

  const eventEmitter = new EventEmitter();
  eventEmitter.killed = false;

  const handlerArgs = { options, shutdown };

  try {
    await downloadBrowser(puppeteerOptions);
    browser = await puppeteer.launch(puppeteerOptions);
    page = await browser.newPage();
    await beforeAll(handlerArgs);
  } catch (err) {
    shutdown(1, err);
    return;
  }

  page.on('error', err => {
    shutdown(1, err);
  });

  page.on('pageerror', err => {
    log('pageerror', err);
    if (!watch) shutdown(1);
  });

  page.on('console', msg => {
    let text = msg.text();
    if (Array.isArray(text)) {
      text = text.join(' ');
    }

    log(text);
    onMessage(text, handlerArgs);
  });

  await page.exposeFunction('__ipcSend', msg => {
    eventEmitter.emit('message', msg.type === 'Buffer' ? Buffer.from(msg) : msg);
  });
  await page.waitForFunction('() => window.__ipcSend != null');
  eventEmitter.send = async msg => {
    await page.waitForFunction('() => window.process !== undefined');
    page.evaluate((msg) => {
      window.__ipcReceive(msg);
    }, msg);
  };
  eventEmitter.cancel = () => {
    shutdown();
  };

  if (watch) {
    log(`Running on: ${url}\n\n`);
  } else {
    page
      .waitForFunction('window.exit !== undefined', { timeout: watch ? 0 : timeout })
      .then(() => {
        return page.evaluate(() => {
          return window.exit;
        });
      })
      .then(code => {
        shutdown(code);
      })
      .catch((err) => {
        shutdown(1, err);
      });
  }

  let firstRun = true;
  const limit = pLimit(1);

  watcher = webpack(webpackConfig, (err, stats) => limit(() => executeScript(err, stats)));

  async function executeScript (err, stats) {
    if (limit.pendingCount > 1) {
      limit.queue = limit.queue.slice(-1);
    }

    if (err) {
      shutdown(1, err);
      return;
    }

    if (stats.hasErrors()) {
      log(`${stats.toString({ chunks: false, colors: true })}`);
      if (!watch) shutdown(1);
      return;
    }

    try {
      if (firstRun) {
        firstRun = false;
        await onExecute(handlerArgs);
        await page.goto(url);
      } else {
        await onExecute(handlerArgs);
        await page.reload();
      }
    } catch (err) {
      shutdown(1, err);
    }
  }

  async function shutdown (code = 0, err) {
    if (eventEmitter.killed) return;
    eventEmitter.killed = true;

    try {
      await afterAll(err);
    } catch (err) {
      log('afterAll error', err);
    }

    if (browser) {
      await browser.close().catch(() => {});
    }

    if (server) {
      await new Promise(resolve => server.close(() => resolve()));
    }

    if (watcher && watcher.close) {
      await new Promise(resolve => watcher.close(() => resolve()));
    }

    if (err) {
      log(err);
    }

    err && eventEmitter.emit('error', err);
    eventEmitter.emit('close');
    processExit && process.exit(code);
  }

  return eventEmitter;
}
