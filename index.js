'use strict';
/**
 * Sails hook for code style check
 * @author Wenjun.Xiao
 * @version 1.0.0
 * @date 2016-10-11
 */

// Check status unknown, init status
const STATUS_UNKNOWN = -1;
// Check success
const STATUS_SUCCESS = 0;
// Check error
const STATUS_ERROR = 1;
// Check warning
const STATUS_WARN = 2;

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const CLIEngine = require('eslint').CLIEngine;

/**
 * Determines whether the plugin is enabled by default, depending on the environment
 *
 * @param {String} env environment
 *
 * @return {Boolean} enabled or not;
 */
function defaultEnable(env) {
  return env === 'development' || env === 'local' || env === 'test';
}

/**
 * Find ESLint configuration in the directory
 * @param {String} directory Where to find configuration
 * @returns {*}
 */
function getESLintConfig(directory) {
  let configs = _.concat(
    path.resolve(directory, '.eslintrc'),
    glob.sync(path.resolve(directory, '.eslintrc.*'))
  ).filter(p => fs.existsSync(p));
  if (configs.length > 0) {
    return configs[0];
  }
  return null;
}

/**
 * Get app's ESLint configuration. If app has configuration return null,
 * and if not, return hook's configuration as default.
 * @param {String} appPath Sails appPath
 * @returns {*}
 */
function getAppESLintConfig(appPath) {
  if (!getESLintConfig(appPath)) {
    return getESLintConfig(__dirname);
  }
  return null;
}

function defaultIfNull(val, defVal) {
  return val || defVal;
}

/**
 * Get globals from sails's models and services
 * @param sails Sails
 * @returns {Array}
 */
function getGlobalsOfSails(sails) {
  return _.concat(
    _.map(sails.models, v => v.globalId),
    _.map(sails.services, v => v.globalId)
  );
}

/**
 * Run eslint and return status
 * @param {Array} patterns
 * @param {String} format
 * @param {Function} reportError
 * @param {Function} reportWarn
 * @param {Object} options
 * @returns {number} status
 */
function runLint(patterns, format, reportError, reportWarn, options) {
  options = defaultIfNull(options, {});
  let cli = new CLIEngine(options);
  let report = cli.executeOnFiles(defaultIfNull(patterns, ['.']));
  let formatter = cli.getFormatter(defaultIfNull(format, 'stylish'));
  if (report) {
    if (report.errorCount > 0) {
      reportError = defaultIfNull(reportError, console.error);
      reportError(formatter(report.results));
      return STATUS_ERROR;
    } else if (report.warningCount > 0) {
      reportWarn = defaultIfNull(reportWarn, console.warn);
      reportWarn(formatter(report.results));
      return STATUS_WARN;
    }
  }
  return STATUS_SUCCESS;
}

module.exports = function(sails) {
  let _status = STATUS_UNKNOWN;
  return {
    /**
     * Default configuration
     */
    defaults: {
      __configKey__: {
        enabled: defaultEnable(sails.config.environment),
        format: 'stylish',
        /**
         * Which files/folders shuold be chekced, and which are ignored.
         * Support `glob` patterns.
         */
        src: [
          '.',
          '!assets/**/*.js',
          '!tasks/**/*.js',
          '!Gruntfile.js',
          '!app.js',
          '!api/responses/**/*.js'
        ],
        reportError: console.error,
        reportWarn: console.warn
      }
    },
    configure: function() {
      Object.defineProperty(this, 'STATUS_UNKNOWN', {
        value: STATUS_UNKNOWN,
        writable: false,
        configurable: false
      });
      Object.defineProperty(this, 'STATUS_ERROR', {
        value: STATUS_ERROR,
        writable: false,
        configurable: false
      });
      Object.defineProperty(this, 'STATUS_WARN', {
        value: STATUS_WARN,
        writable: false,
        configurable: false
      });
      Object.defineProperty(this, 'status', {
        get: function() {
          return _status;
        }
      });
    },
    initialize: function initialize(cb) {
      if (!sails.config[this.configKey].enabled) {
        sails.log.verbose('ESLint hook disabled.');
        return cb();
      } else {
        let config = sails.config[this.configKey];
        // Check if the project has a configuration file, and if not, use the plugin's configuration as the default
        let configFile = getAppESLintConfig(sails.config.appPath);
        // Add all sails's global object to eslint's globals
        let globals = _.concat(Object.keys(global), getGlobalsOfSails(sails));
        let src = config.src;
        // Extract the path to be ignored
        let ignorePattern = src.filter(p => p.trim().startsWith('!')).map(p => p.trim().substr(1));
        let patterns = src.filter(p => !p.trim().startsWith('!'));
        sails.log.info('ESLint start...');
        _status = runLint(patterns, config.format, config.reportError, config.reportWarn, {
          globals: globals,
          ignorePattern: ignorePattern,
          configFile: configFile
        });
        sails.log.info('ESLint finished.');
        return cb();
      }
    }
  };
};
