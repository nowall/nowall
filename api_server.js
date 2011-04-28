(function() {
  var connect;
  connect = require('connect');
  module.exports = connect(connect.router(function(app) {
    return app.get('/paypal/IPN', function(app) {});
  }));
}).call(this);
