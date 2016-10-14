# sails-hook-lint

[![NPM version](https://img.shields.io/npm/v/sails-hook-lint.svg?style=flat-square)](https://www.npmjs.com/package/sails-hook-lint)
[![Build status](https://img.shields.io/travis/wenjunxiao/sails-hook-lint.svg?style=flat-square)](https://travis-ci.org/wenjunxiao/sails-hook-lint)
[![Test coverage](https://img.shields.io/coveralls/wenjunxiao/sails-hook-lint.svg?style=flat-square)](https://coveralls.io/github/wenjunxiao/sails-hook-lint)
[![Downloads](http://img.shields.io/npm/dm/sails-hook-lint.svg?style=flat-square)](https://npmjs.org/package/sails-hook-lint)

  Use [ESlint](http://eslint.org/) to check sails app code.

## Installation

```bash
$ npm install sails-hook-lint
```

## Usage

  Put eslint configuration in your root folder, and if not, will use the plugin's configuration as default.
  Then you just lift app as normal, by default, lint only run in development and local environment.
 
  For an example of eslint configuration: [.eslintrc.yml](./.eslintrc.yml).
  More configuration references http://eslint.org/docs/user-guide/configuring.

## Configuration

 Change the default configuration by adding ``config/lint.js`` under your sails project

```js
module.exports.lint = {
  enabled: true, // Enable lint. Defaults to `true`
  format: 'stylish', // Formatter. Defaults to `stylish`
  // Folders or files to lint or be ignored, support glob patterns,
  // pattern that starts with '!' are ignored by linting.  
  src: [
    '.',
    '!assets/**/*.js',
    '!tasks/**/*.js',
    '!Gruntfile.js',
    '!app.js',
    '!api/responses/**/*.js'
  ]
};
```

## License

  MIT
