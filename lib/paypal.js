var https = require('https'),
    querystring = require('querystring'),
    util = require('util');

module.exports = function(options) {
  var host = options.sandbox ? 'www.sandbox.paypal.com' : 'www.paypal.com'
    , verifyPath = "/cgi-bin/webscr"
    ;

  if (!options.email) {
    throw new Error('you must specify email for paypal');
  }
  if (!options.exists) {
    throw new Error('you must provide function "exists"');
  }

  var verify = function(req, callback) {

    var body = '';

    req.on('data', function(chunk) {
        return body += chunk;
    });

    return req.on('end', function() {
        return verifyBody(body, req.headers, callback);
    });

  };

  var verifyBody = function(body, headers, callback) {
    var data;

    if (typeof body === 'string') {
      data = querystring.parse(body);
    } else {
      data = body;
      body = querystring.stringify(data);
    }

    if (data.receiver_email !== options.email) {
      return callback(new Error('Wrong email ' + data.receiver_email));
    }
    if (data.payment_status !== 'Completed') {
      return callback(new Error('InCompleted, Status is ' + data.payment_status));
    }
    if (!data.payment_gross) {
      return callback(new Error('Payment gross is 0'));
    }

    options.exists(data.txn_id, function(err, exists) {
        var paypalReq, requestOptions;
        if (err) {
          return callback(new Error('Unable to check exists IPN', err));
        }
        if (exists) {
          return callback(new Error('PayPalIPN txn_id Already exists'));
        }
        requestOptions = {
          host: host,
          path: verifyPath + '?cmd=_notify-validate&' + body,
          method: 'GET'
          /*,headers: {
            'Content-Type': headers && headers['content-type'] || 'application/x-www-form-urlencoded'
            , 'Content-Length': headers && headers['content-length'] || Buffer.byteLength(body)
          }*/
        };
        paypalReq = https.request(requestOptions, function(paypalRes) {
            paypalRes.setEncoding('ascii');

            paypalRes.on('data', function(chunk) {
                // console.log('Verify response is <' + chunk + '> verified is ' + (chunk === 'VERIFIED'));
                if (chunk === 'VERIFIED') {
                  callback(null, data);
                } else {
                  callback(new Error('NOT VERIFIED'), data);
                }
            });
        });

        paypalReq.on('error', function(err){
            callback(err);
        });

        paypalReq.end();
    });
  };

  return {
    verify: verify,
    verifyBody : verifyBody
  };

};
