var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , connect = require('connect')
  , connect_block = require('connect-block')
  , config = require('./config')
  , log4js = require('log4js')
  , plugin = require('./plugin')
  , whitelist = require('./conf/whitelist')
  ;

// apply settings
// TODO 重新整理这段代码
config.port = config.port || 443;
config.useHttps = config.useHttps || this.port === 443;

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

var plugins = plugin()
  .use(plugin.headers)
  .use(plugin.cookie)
  .use(plugin.stream)
  // .use(plugin.youtube)
  .use(plugin.twitter)
  .use(plugin.ga)
  .use(plugin.gad)
  .use(plugin.bodyEncoder) // encodeBody and write to response

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
  , compress: config.compress
  , logger: config.logger
  , whiteList: whitelist.whitelist
  , plugins: plugins
}

console.log(config.proxyOption.whiteList)

var proxyv1 = global.proxy = require('./lib/proxy')(config.proxyOption);

var proxyv2 = require('./lib/proxyv2')(config.proxyOption);

var block_bot = connect_block({agent: ['google', 'baidu', /.*bot.*/], text: 'Goodbye'});

var appv2 = module.exports = connect()
  .use(connect.favicon(__dirname + '/public/images/favicon.ico'))
  .use(connect.vhost('www.' + config.server, require('./appv2')))
  .use(config.server, require('./appv2'))
  .use(block_bot)
  .use(connect.vhost('ipn.' + config.server, require('./routes/ipn')))
// v2 proxy
  .use(connect.vhost('ssl.' + config.server, proxyv2))
// v1 proxy
  .use(connect.vhost('*.' + config.server, proxyv1))
// home
  .use(require('./appv2'))

function redirectToHttps (req, res, next) {
  if(req.method === 'GET' &&
    req.headers.cookie &&
    req.headers.cookie.indexOf('nowall_version=2') >= 0) {
    var url = req.headers.host.replace(httpPortSuffix, httpsPortSuffix) + req.url;
    console.log(url)
    res.writeHead(302, {
        location: 'https://' + url
    });
    res.end();
  } else {
    next();
  }
}

var appv1 = connect()
  .use(connect.favicon(__dirname + '/public/images/favicon.ico'))
  .use(connect.vhost('ipn.' + config.server, require('./routes/ipn')))
  .use(connect.vhost('v1.' + config.server, require('./app')))
  .use(redirectToHttps)
  .use(connect.vhost(config.server, require('./app')))
  .use(block_bot)
  .use(connect.vhost('*.' + config.server, proxyv1))
  .use(require('./app'));

process.on('uncaughtException', function(err) {
    return logger.error('UncaughtException', err.stack);
});

if(httpsPort) {

  var options = {
    key: fs.readFileSync(__dirname + "/cert/ssl.key")
  , cert: fs.readFileSync(__dirname + "/cert/ssl.crt")
  }

  https.createServer(options, appv2).listen(httpsPort);
}
http.createServer(appv1).listen(httpPort);
