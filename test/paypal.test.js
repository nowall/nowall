(function() {
  var db, ipn, paypal;
  paypal = require('../connect-paypal');
  db = {};
  ipn = paypal({
    email: 'guileen@gmail.com',
    test: true,
    log4js: require('log4js')(),
    exists: function(id, fn) {
      return fn(null, !!db[id]);
    },
    complete: function(data, logger) {
      return console.dir(data);
    }
  });
  ipn.verify({
    receiver_email: 'guileen@gmail.com',
    payment_status: 'Completed'
  });
  setTimeout(function() {
    return ipn.verify({
      receiver_email: 'guileen2@gmail.com',
      payment_status: 'Completed'
    });
  }, 1000);
  setTimeout(function() {
    return ipn.verify({
      receiver_email: 'guileen@gmail.com',
      payment_status: 'Sdfsaf'
    });
  }, 2000);
  setTimeout(function() {
    return ipn.verify({
      receiver_email: 'guileen@gmail.com',
      payment_status: 'Completed',
      payment_fee: 20.00
    });
  }, 3000);
  setTimeout(function() {
    return ipn.verify({
      receiver_email: 'guileen@gmail.com',
      payment_status: 'Completed',
      payment_fee: 20.00
    });
  }, 4000);
}).call(this);
