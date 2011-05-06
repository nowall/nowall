module.exports = {
  logfile: '/var/log/node-server.log',
  server: 'nowall.be',
  port: 80,
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
