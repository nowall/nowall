var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    connect = require('connect'),
    config = require('./config'),
    proxy_server = require('./proxy'),
    api_server = require('./api_server'),
    app = require('./app'),
    logger = config.logger.getLogger('server');

var options = {
  key: fs.readFileSync(__dirname + "/cert/server.key"),
  cert: fs.readFileSync(__dirname + "/cert/server.crt")
};

config.useHttps = config.useHttps && true;
config.port = config.port || (config.useHttps ? 443 : 80);

var server = module.exports = connect(
  connect.logger(),
  connect.vhost(config.server, app),
  connect.vhost('api.' + config.server, api_server),
  connect.vhost('*.' + config.server, proxy_server),
  app
);

process.on('uncaughtException', function(err) {
    return logger.error('UncaughtException', err);
});

if (!module.parent) {
  server.listen(config.port);
}
