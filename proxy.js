var config, connect, proxy;
require.paths.unshift(__dirname + "/support/");
connect = require('connect');
config = require('./config');
config.useHttps = config.useHttps && true;
config.port = config.port || (config.useHttps ? 443 : 80);
proxy = global.proxy = require('myproxy')({
    server: config.server,
    port: config.port,
    useHttps: config.useHttps,
    compress: config.compress || false,
    logger: config.logger
});
module.exports = connect(function(req, res) {
    try {
      return proxy(req, res);
    } catch (e) {
      return logger.error('error to handle proxy of ' + req.headers.host + req.url, e);
    }
});
