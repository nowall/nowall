module.exports = {
  logfile: 'server.log',
  server: 'nowall.dev',
  port: 8000,
  useHttps: false,

  database: 'mongodb://localhost/nowall',
  auth_database: 'mongodb://localhost/oauth',

  // paypal
  receiver_email: 'seller_1303880284_biz@gmail.com',

  // sendmail
  sender: 'test-noreply@nowall.be'
};
