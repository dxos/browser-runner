# @dxos/browser-runner

> CLI to run JavaScript files into a headless browser.

[![Build Status](https://travis-ci.com/dxos/browser-runner.svg?branch=master)](https://travis-ci.com/dxos/browser-runner)
[![Coverage Status](https://coveralls.io/repos/github/dxos/browser-runner/badge.svg?branch=master)](https://coveralls.io/github/dxos/browser-runner?branch=master)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

## Install

```
$ npm install -g @dxos/browser-runner
```

## Usage

```
$ browser-runner --help

cli.js <file> [options] [-- puppeteerOptions]

runs the script

Positionals:
  file  the file to run                                                 [string]

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  --config, -c  webpack config                                          [string]
  --watch, -w   watch                                                  [boolean]
  --port, -p    port to run                                             [number]
  --env         env file                                                [string]
```

### Testing in Chrome

```
$ browser-runner script.js
```

### Testing in Firefox (experimental)

You can test with Firefox using the puppeteer option `product`.

```
$ browser-runner script.js -- --product firefox
```

Important: First time the execution will take longer since it has to download the firefox browser.

### Process exit

`browser-runner` cannot know when your script finish the execution.

If you want to exit the process at some point in your script runs or throw an unhandled `Error`:

### Environment variables

Your script can use environment variables from the shell or a `.env` file.

// script.js
```javascript
console.log(process.env.NODE_ENV) // development
console.log(process.env.SOME_VARIABLE) // foo
```

```
$ NODE_ENV=development SOME_VARIABLE=foo browser-runner scripts.js
```

## Contributing

PRs accepted.

## License

GPL-3.0 © dxos
