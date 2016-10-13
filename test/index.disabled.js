'use strict';

const sinon = require('sinon');
const rewire = require('rewire');
const Sails = require('sails').Sails;
const lint = require('eslint');

describe('Disable hook tests ::', function() {
  let sails;
  let report;
  let noConsole = function() {};

  before(function(done) {
    this.timeout(20000);
    Sails().lift({
      hooks: {
        // Load the hook
        'lint': require('../'),
        // Skip grunt (unless your hook uses it)
        'grunt': false
      },
      log: {
        level: 'error'
      },
      environment: 'prod_env'
    }, function(err, _sails) {
      if (err) return done(err);
      sails = _sails;
      return done();
    });
  });

  beforeEach(function() {
    report = null;
    sinon.stub(lint, 'CLIEngine', function() {
      return {
        getFormatter: function() {
          return JSON.stringify;
        },
        executeOnFiles: function() {
          return report;
        }
      };
    });
  });

  afterEach(function() {
    lint.CLIEngine.restore();
  });

  after(function(done) {
    // Lower Sails (if it successfully lifted)
    if (sails) {
      return sails.lower(done);
    }
    return done();
  });

  it('sails disable lint hook and does not crash', function() {
    return true;
  });

  it('runLint success', function() {
    let lib = rewire('../index.js');
    let runLint = lib.__get__('runLint');
    let STATUS_SUCCESS = lib.__get__('STATUS_SUCCESS');
    runLint([], '', noConsole, noConsole, {}).should.be.exactly(STATUS_SUCCESS);
  });

  it('runLint error', function() {
    let lib = rewire('../index.js');
    let runLint = lib.__get__('runLint');
    let STATUS_ERROR = lib.__get__('STATUS_ERROR');
    report = {
      results: ['error'],
      errorCount: 1,
      warningCount: 0
    };
    runLint([], '', noConsole, noConsole, {}).should.be.exactly(STATUS_ERROR);
  });

  it('runLint warning', function() {
    let lib = rewire('../index.js');
    let runLint = lib.__get__('runLint');
    let STATUS_WARN = lib.__get__('STATUS_WARN');
    report = {
      results: ['warning'],
      errorCount: 0,
      warningCount: 1
    };
    runLint([], '', noConsole, noConsole, {}).should.be.exactly(STATUS_WARN);
  });
});
