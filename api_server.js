var connect = require('connect'),
    config = require('./config'),
    db = require('./database'),
    jst = require('jst'),
    sendmail = require('sendmail').sendmail,
    logger = config.logger.getLogger('api_server');

function sendUserMail(user, subject, template, logger) {
  jst.renderFile('./views/mails/' + template,
    { user: user,
      config: config
    }, function(err, result) {
      sendmail({
          from: config.sender,
          to: user.email,
          subject: 'Thank you for support nowall',
          type: 'text/html',
          content: result
        },function(err, message) {
          if (err) {
            logger.error('cant send mail to ' + user.email, err);
          } else {
            logger.info('mail send to ' + user.email);
          }
      });
  });
}

function sendVerifyMail(user, logger) {
  sendUserMail(user, 'Thank you for support nowall', 'donation.html', logger);
}

function sendThanksMail(user, logger) {
  sendUserMail(user, 'Thank you for support nowall', 'thanks.html', logger);
}

function updateUserDonation(data, logger) {

  var email = data.payer_email,
      screen_name = data.first_name + ' ' + data.last_name,
      gross = parseInt(data.payment_gross);

  db.user.findOne({email: email}, function(err, reply) {
      if (!reply) {
        var user = {
          email: email,
          first_name: data.first_name,
          last_name: data.last_name,
          screen_name: data.first_name + ' ' + data.last_name,
          donation: gross,
          verify_code: Math.floor(Math.random() * 0xffffffff).toString(32)
        };
        db.user.insert( user , function(err, reply) {
            sendVerifyMail(user, logger);
        });
      } else {
        db.user.findAndModify({email: email}, [], {$inc: {donation: gross}}, function(err, user) {
            if (err) {
              logger.error(err.message, err);
            }
            else {
              sendThanksMail(user, logger);
              logger.info('update donation of ' + email);
            }
        });
      }
  });
}

var paypal = require('./lib/paypal')({
    path: '/paypal/IPN',
    email: config.receiver_email,
    log4js: config.logger,
    sandbox: config.sandbox,
    exists: function(txn_id, fn) {
      db.payment.findOne({txn_id: txn_id}, {txn_id: 1}, function(err, reply) {
          fn(err, !!reply);
      });
    }
});

module.exports = connect.createServer(
  connect.router(function(app){
      //begin app
      app.post('/paypal/IPN', function(req, res){
          paypal.verify(req, function(err, data, logger) {
              if(err) return logger.error('error to verify', err);
              logger.info('verified payment of ' + data.payer_email + ' amount:' + data.payment_gross);
              db.payment.insert(data, function(err, reply) {
                  if (err) {
                    logger.error('error to insert payment data', err);
                  } else {
                    // must update user information after successfully insert payment information
                    // the notification message will be send again.
                    updateUserDonation(data, logger);
                  }
              });
          });
      });

      //end app
  }),

  function(req, res, next){
    res.end('404 Not found. This is API server', 404);
  }
);

if (!module.parent) {
  var data = {
    txn_id: 'testtest',
    payer_email: 'guileen@gmail.com',
    receiver_email: config.receiver_email,
    first_name: '桂',
    last_name: '林',
    payment_fee: '1.52',
    payment_gross: '20.00',
    payment_status: 'Completed'
  }
  paypal.verifyBody(data, {}, function(err, data, logger){
      if(err) return logger.error('error to verifyBody', err);
      console.dir(data);
  });

  updateUserDonation(data, logger);

  sendVerifyMail({
      email: data.payer_email,
      first_name: data.first_name,
      last_name: data.last_name,
      screen_name: data.first_name + ' ' + data.last_name,
      verify_code: Math.floor(Math.random() * 0xffffffff).toString(32)
    }, logger);

  sendThanksMail({
      email: data.payer_email,
      first_name: data.first_name,
      last_name: data.last_name,
      screen_name: data.first_name + ' ' + data.last_name,
      verify_code: Math.floor(Math.random() * 0xffffffff).toString(32)
    }, logger);


}
