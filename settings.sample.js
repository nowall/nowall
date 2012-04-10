module.exports = {
  logfile: './node-server.log',
  server: 'dev',//'nowall.be',
  httpPort: 3000,
  httpsPort: 3333, // set to undefined if no cert
  forceHtpps: false,

  database: 'mongodb://localhost/nowall',
  auth_database: 'mongodb://localhost/oauth',

  // paypal
  receiver_email: 'guileen@gmail.com',
  business: 'WLUP24S9ZJYCL',
  sandbox: false,

  // sendmail
  sender: 'noreply@nowall.be'
};
