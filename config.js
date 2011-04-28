var config, log4js;
config = module.exports = {
  logfile: 'server.log',
  server: 'nowall.dev',
  port: 8000,
  useHttps: false
};
config.port = config.port || 443;
config.useHttps = config.useHttps || this.port === 443;
config.compress = config.compress || false;
if (config.port === 443 || config.port === 80) {
  config.serverAndPort = config.server;
} else {
  config.serverAndPort = config.server + ':' + config.port;
}
config.scheme = config.useHttps && 'https' || 'http';
config.searchUrl = "" + config.scheme + "://search." + config.serverAndPort;
config.baseUrl = "" + config.scheme + "://" + config.serverAndPort;
log4js = require('log4js')();
log4js.addAppender(log4js.fileAppender(config.logfile));
config.logger = log4js;
