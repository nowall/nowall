var https, querystring, sys;
https = require('https');
querystring = require('querystring');
sys = require('sys');
module.exports = function(options) {
  var host, log4js, middleware, path, topLogger, verify;
  host = options.test ? 'www.sandbox.paypal.com' : 'www.paypal.com';
  path = "/cgi-bin/websc";
  log4js = options.log4js;
  if (!options.email) {
    throw new Error('you must specify email for paypal');
  }
  if (!options.exists) {
    throw new Error('you must provide function "exists"');
  }
  topLogger = log4js.getLogger('PayPalIPN');
  middleware = function(req, res, next) {
    var body;
    body = '';
    req.on('data', function(chunk) {
        return body += chunk;
    });
    return req.on('end', function() {
        return verify(body, req.headers);
    });
  };
  verify = function(body, headers) {
    var data, logger;
    if (typeof body === 'string') {
      data = querystring.parse(body);
    } else {
      data = body;
      body = querystring.stringify(data);
    }
    logger = log4js.getLogger('IPN ' + data.txn_id);
    logger.debug('Data\n' + sys.inspect(data));
    if (data.receiver_email !== options.email) {
      return logger.info('Wrong email ' + data.receiver_email);
    }
    if (data.payment_status !== 'Completed') {
      return logger.info('InCompleted, Status is ' + data.payment_status);
    }
    if (!data.payment_fee) {
      return logger.info('Payment fee is 0');
    }
    return options.exists(data.txn_id, function(err, exists) {
        var paypalReq, requestOptions;
        if (err) {
          return logger.error('Unable to check exists IPN', err);
        }
        if (exists) {
          return logger.info('Already exists');
        }
        requestOptions = {
          host: host,
          path: path,
          method: 'POST',
          headers: {
            'Content-Type': headers && headers['content-type'] || 'application/x-www-form-urlencoded',
            'Content-Length': headers && headers['content-length'] || Buffer.byteLength(body)
          }
        };
        paypalReq = https.request(requestOptions, function(paypalRes) {
            return paypalRes.on('data', function(chunk) {
                logger.info('Verify response is ' + chunk);
                if (chunk === 'VERIFIED') {
                  return options.complete(data, logger);
                }
            });
        });
        return paypalReq.end(body);
    });
  };
  middleware.verify = verify;
  return middleware;
};
