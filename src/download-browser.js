//
// Copyright 2020 DxOS.
//

import puppeteer from 'puppeteer';

function getRevision (browserFetcher) {
  const { PUPPETEER_REVISIONS } = require('puppeteer/lib/cjs/puppeteer/revisions');
  const product = browserFetcher.product();

  if (product === 'chrome') {
    return `${process.env.PUPPETEER_CHROMIUM_REVISION || PUPPETEER_REVISIONS.chromium}`;
  } else if (product === 'firefox') {
    return `${process.env.PUPPETEER_FIREFOX_REVISION || PUPPETEER_REVISIONS.firefox}`;
  } else {
    throw new Error(`Unsupported product ${product}`);
  }
}

export async function downloadBrowser ({ product = process.env.PUPPETEER_PRODUCT }) {
  const browserFetcher = puppeteer.createBrowserFetcher({
    product
  });

  const revision = getRevision(browserFetcher);
  const revisions = await browserFetcher.localRevisions();
  if (revisions.includes(revision)) return;
  await browserFetcher.download(revision);
}
