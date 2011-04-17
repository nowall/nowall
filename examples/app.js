var https = require('https'),
  fs = require('fs'),
  Proxy = require(__dirname + '/../lib/proxy');

var options = {
  key: fs.readFileSync(__dirname + '/../cert/server.key'),
  cert: fs.readFileSync(__dirname + '/../cert/server.crt')
};

var SERVER_PORT = 8000;

var proxy = new Proxy({server: 'dev', port: SERVER_PORT, useHttps: true, logger = require('log4js')()});

https.createServer(options, function(req, res) {

    proxy(req, res);

})
.addListener('close', function() {
    sys.puts('connection closed');
})
.addListener('error', function(err) {
    sys.puts('server error' + sys.inspect(err));
})
.addListener('clientError', function(err) {
    sys.puts(' server on clientError' + sys.inspect(err));
})
.listen(SERVER_PORT);


