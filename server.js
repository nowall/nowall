var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , connect = require('connect')
  , config = require('./config')
  , logger = config.logger.getLogger('server');

var httpsPort = config.httpsPort
  , httpPort = config.httpPort
  , httpURL = 'http://' + config.server + (httpPort == 80 ? '' : ':' + httpPort)
  , httpsURL = 'https://' + config.server + (httpsPort == 443 ? '' : ':' + httpsPort)

var options = {}

if(httpsPort) {
  options.key= fs.readFileSync(__dirname + "/cert/server.key"),
  options.cert= fs.readFileSync(__dirname + "/cert/server.crt")
}

var proxy = global.proxy =  require('./lib/proxy')({
    // ---- remove below
    server: config.server
  , port: httpPort
  , httpsPort: httpsPort
  , useHttps: false
    // -----------
  , httpURL: httpURL
  , httpsURL: httpsURL
  , compress: !!config.compress
  , logger: config.logger
});

var app = module.exports = connect(options)
  .use(connect.vhost(config.server, require('./app')))
  .use(connect.vhost('ipn.' + config.server, require('./routes/ipn')))
  .use(connect.vhost('*.' + config.server, proxy))

process.on('uncaughtException', function(err) {
    return logger.error('UncaughtException', err);
});

if (!module.parent) {
  if(httpsPort) {
    https.createServer(options, app).listen(httpsPort);
  }

  if(config.forceHtpps) {
    var _app = connect().use(function(req, res) {
        // TODO
        res.redirect(httpsURL);
    });
    http.createServer(_app).listen(httpPort);
  } else {
    http.createServer(app).listen(httpPort);
  }
}
