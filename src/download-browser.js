//
// Copyright 2020 DxOS.
//

import puppeteer from 'puppeteer';

function getRevision (browserFetcher) {
  const packageJSON = require('puppeteer/package.json');
  const product = browserFetcher.product();

  if (product === 'chrome') {
    return `${process.env.PUPPETEER_CHROMIUM_REVISION || packageJSON.puppeteer.chromium_revision}`;
  } else if (product === 'firefox') {
    return `${process.env.PUPPETEER_FIREFOX_REVISION || 78}`;
  } else {
    throw new Error(`Unsupported product ${product}`);
  }
}

export async function downloadBrowser ({ product }) {
  const browserFetcher = puppeteer.createBrowserFetcher({
    product
  });

  const revision = getRevision(browserFetcher);
  const revisions = await browserFetcher.localRevisions();
  if (revisions.includes(revision)) return;
  await browserFetcher.download(revision);
}
