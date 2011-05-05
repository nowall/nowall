var https = require('https'),
    querystring = require('querystring'),
    sys = require('sys');

module.exports = function(options) {
//https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_notify-validate&mc_gross=19.95&protection_eligibility=Eligible&address_status=confirmed&payer_id=LPLWNMTBWMFAY&tax=0.00&...&payment_gross=19.95&shipping=0.00
  var host = options.test ? 'www.sandbox.paypal.com' : 'www.paypal.com',
      path = "/cgi-bin/webscr",
      log4js = options.log4js;

  if (!options.email) {
    throw new Error('you must specify email for paypal');
  }
  if (!options.exists) {
    throw new Error('you must provide function "exists"');
  }
  if (!options.log4js) {
    throw new Error('you must specify log4js instance');
  }

  var topLogger = log4js.getLogger('PayPalIPN');

  var verify = function(req) {

    var body = '';

    req.on('data', function(chunk) {
        return body += chunk;
    });

    return req.on('end', function() {
        return verifyBody(body, req.headers);
    });

  };

  var verifyBody = function(body, headers) {
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
    if (!data.payment_gross) {
      return logger.info('Payment fee is 0');
    }

    options.exists(data.txn_id, function(err, exists) {
        var paypalReq, requestOptions;
        if (err) {
          return logger.error('Unable to check exists IPN', err);
        }
        if (exists) {
          return logger.info('Already exists');
        }
        requestOptions = {
          host: host,
          path: path + '?cmd=_notify-validate&' + body,
          method: 'GET',
          headers: {
            'Content-Type': headers && headers['content-type'] || 'application/x-www-form-urlencoded',
            'Content-Length': headers && headers['content-length'] || Buffer.byteLength(body)
          }
        };
        paypalReq = https.request(requestOptions, function(paypalRes) {
            return paypalRes.on('data', function(chunk) {
                logger.info('Verify response is ' + chunk);
                if (chunk === 'VERIFIED') {
                  return options.onVerified(data, logger);
                }
            });
        });
        return paypalReq.end();
    });
  };

  return {
    verify: verify,
    verifyBody : verifyBody
  };

};
