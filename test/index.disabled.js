'use strict';

const Sails = require('sails').Sails;

describe('Disable hook tests ::', function() {
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
      environment: 'prod_env'
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
    return done();
  });

  it('sails disable lint hook and does not crash', function() {
    return true;
  });

});
