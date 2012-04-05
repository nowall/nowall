module.exports = {
  logfile: './node-server.log',
  server: 'dev',//'nowall.be',
  port: 3000,
  useHttps: false,

  database: 'mongodb://localhost/nowall',
  auth_database: 'mongodb://localhost/oauth',

  // paypal
  receiver_email: 'guileen@gmail.com',
  business: 'WLUP24S9ZJYCL',
  sandbox: false,

  // sendmail
  sender: 'noreply@nowall.be'
};
