var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , connect = require('connect')
  , config = require('./settings')
  , log4js = require('log4js')
  ;

// apply settings
// TODO 重新整理这段代码
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

log4js.addAppender(log4js.fileAppender(config.logfile));
config.logger = log4js;


var httpsPort = config.httpsPort
  , httpPort = config.httpPort
  , httpPortSuffix = config.httpPortSuffix = httpPort == 80 ? '' : ':' + httpPort
  , httpsPortSuffix = config.httpsPortSuffix = httpsPort == 443 ? '' : ':' + httpsPort
  , httpURL = config.httpURL = 'http://ssl.' + config.server + config.httpPortSuffix
  , httpsURL = config.httpsURL = 'https://ssl.' + config.server + config.httpsPortSuffix
  , logger = config.logger.getLogger('server');
  ;

config.proxyOption = {
    // ---- remove below
    server: config.server
  , port: httpPort
  , httpsPort: httpsPort
  , useHttps: false
    // -----------
  , httpURL: httpURL
  , httpsURL: httpsURL
  , baseURL: httpsURL
  , compress: !!config.compress
  , logger: config.logger
}

var proxyv1 = global.proxy = require('./lib/proxy')(config.proxyOption);

var proxyv2 = require('./lib/proxyv2')(config.proxyOption);

var options = {}

if(httpsPort) {
  options.key= fs.readFileSync(__dirname + "/cert/ssl.key"),
  options.cert= fs.readFileSync(__dirname + "/cert/ssl.crt")
}

var appv2 = module.exports = connect(options)
  .use(connect.vhost('www.' + config.server, require('./appv2')))
  .use(connect.vhost('ipn.' + config.server, require('./routes/ipn')))
// v2 proxy
  .use(connect.vhost('ssl.' + config.server, proxyv2))
// v1 proxy
  .use(connect.vhost('*.' + config.server, proxyv1))
// home
  .use(require('./appv2'))

var appv1 = connect(options)
  .use(connect.vhost('ipn.' + config.server, require('./routes/ipn')))
  .use(connect.vhost('v1.' + config.server, require('./app')))
  .use(connect.vhost('*.' + config.server, proxyv1))
  .use(require('./app'));

process.on('uncaughtException', function(err) {
    return logger.error('UncaughtException', err);
});

if (!module.parent) {
  if(httpsPort) {
    https.createServer(options, appv2).listen(httpsPort);
  }
  http.createServer(appv1).listen(httpPort);
}
