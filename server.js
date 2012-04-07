var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    connect = require('connect'),
    config = require('./config'),
    proxy_app = require('./proxy'),
    api_app = require('./api_server'),
    site_app = require('./site_app'),
    logger = config.logger.getLogger('server');

var options = {
  key: fs.readFileSync(__dirname + "/cert/server.key"),
  cert: fs.readFileSync(__dirname + "/cert/server.crt")
};

config.useHttps = config.useHttps && true;
config.port = config.port || (config.useHttps ? 443 : 80);

var app = module.exports = connect()
  .use(connect.vhost(config.server, site_app))
  .use(connect.vhost('api.' + config.server, api_app))
  .use(connect.vhost('*.' + config.server, proxy_app))

// var server = module.exports = connect(
//   // connect.logger(),
//   function(req, res, next) {
//     throw new Error('ssss')
//     console.log(req.hostname)
//     logger.log(req)
//     next()
//   },
// // ,
//   // connect.vhost(config.server, site_app),
//   // connect.vhost('api.' + config.server, api_app),
//   // connect.vhost('*.' + config.server, proxy_app),
//   // site_app
// );

process.on('uncaughtException', function(err) {
    return logger.error('UncaughtException', err);
});

if (!module.parent) {
  app.listen(config.port);
}
