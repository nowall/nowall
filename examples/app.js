var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    log4js = require('log4js')(),
    useHttps = false,
    port = 8000;

proxy = require('../lib/proxy')({
    server: 'dev',
    port: port,
    useHttps: useHttps,
    compress: false,
    logger: log4js
});


logger = log4js.getLogger('server');

handle = function(req, res) {
  try {
    return proxy(req, res);
  } catch (e) {
    return logger.error('error to handle proxy of ' + req.headers.host + req.url, e);
  }
};

if (useHttps) {
  proxy_server = https.createServer({
      key: fs.readFileSync(__dirname + '../cert/server.key'),
      cert: fs.readFileSync(__dirname + '../cert/server.crt')
    }, handle);
} else {
  proxy_server = http.createServer(handle);
}

proxy_server.addListener('clientError', function(err) {
    return logger.error(err.message, err);
});

proxy_server.listen(port);
