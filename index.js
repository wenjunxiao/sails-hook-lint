'use strict';
/**
 * Sails hook for code style check
 * @author Wenjun.Xiao
 * @version 1.0.0
 * @date 2016-10-11
 */

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

module.exports = function(sails) {
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
        let cli = new CLIEngine({
          globals: globals,
          ignorePattern: ignorePattern,
          configFile: configFile
        });
        sails.log.info('ESLint start...');
        let report = cli.executeOnFiles(patterns || /* istanbul ignore next */ ['.']);
        let formatter = cli.getFormatter(config.format || /* istanbul ignore next */ 'stylish');
        /* istanbul ignore next */
        if (report) {
          if (report.errorCount > 0) {
            let reportError = config.errorReport || /* istanbul ignore next */ console.error;
            reportError(formatter(report.results));
          } else if (report.warningCount > 0) {
            let reportWarn = config.errorWarn || /* istanbul ignore next */ console.warn;
            reportWarn(formatter(report.results));
          }
        }
        sails.log.info('ESLint finished.');
        return cb();
      }
    }
  };
};
