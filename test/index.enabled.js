'use strict';

const should = require('should');
const rewire = require('rewire');
const lint = require('eslint');
const Sails = require('sails').Sails;

describe('Enable tests ::', function() {
  let sails;

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
      environment: 'development'
    }, function(err, _sails) {
      if (err) return done(err);
      sails = _sails;
      return done();
    });
  });

  after(function(done) {
    // Lower Sails (if it successfully lifted)
    if (sails) {
      return sails.lower(done);
    }
    lint.CLIEngine.restore();
    return done();
  });

  it('sails load lint hook and does not crash', function() {
    return true;
  });

  it('check status is a readonly number', function() {
    sails.hooks.lint.should.have.property('status').which.is.a.Number();
    (function() {
      sails.hooks.lint.status = 1;
    }).should.throw();
  });

  it('find global of sails', function() {
    let lib = rewire('../index.js');
    let getGlobalsOfSails = lib.__get__('getGlobalsOfSails');
    sails.models = [{
      globalId: 'Test'
    }];
    sails.services = [{
      globalId: 'TestService'
    }];
    getGlobalsOfSails(sails).should.be.instanceof(Array).and.containDeep(['Test', 'TestService']);
    return true;
  });

  it('eanbled/disabled in different environment', function() {
    let lib = rewire('../index.js');
    let defaultEnable = lib.__get__('defaultEnable');
    defaultEnable('development').should.eql(true);
    defaultEnable('local').should.eql(true);
    defaultEnable('test').should.eql(true);
    defaultEnable('production').should.eql(false);
  });

  it('load eslintrc from current hook', function() {
    let lib = rewire('../index.js');
    let getESLintConfig = lib.__get__('getESLintConfig');
    should(getESLintConfig(__dirname + '/../')).be.ok();
    should(getESLintConfig(__dirname)).not.be.ok();
  });

  it('load eslintrc as app default configuration', function() {
    let lib = rewire('../index.js');
    let getAppESLintConfig = lib.__get__('getAppESLintConfig');
    should(getAppESLintConfig(__dirname + '/../')).not.be.ok();
    should(getAppESLintConfig(__dirname)).be.ok();
  });

});
