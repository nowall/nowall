var connect = require('connect'),
    config = require('./config');

module.exports = connect(
  require('./connect-paypal')({
      path: '/paypal/IPN',
      email: 'guileen@gmail.com',
      log4js: config.logger,
      exists: function(txn_id, fn){

      },
      onVerified: function(data, logger) {

      }
  })
);
