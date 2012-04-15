/**
* @author: guileen@gmail.com
*/

//TODO: More test
//TODO: User controll
//TODO: compress support
//TODO: redis cache for static file like webDav
//TODO: compress output only

var https = require('https'),
    http = require('http'),
    querystring = require('querystring'),
    util = require('util');

/**
* options : server, port, useHttps
* TODO
*   baseHTTP: string
*   baseHTTPS: string
*   timeout: int
*   allowCookie: boolean
*   allowImage: boolean
*   allowBin: boolean
*   maxLength: int
*   whiteList: Array // won't encrypt link
*   blackList: Array // won't proxy
*
*/
var proxy = module.exports = function(options) {

  options.port = options.port || 443;
  options.useHttps = options.useHttps || this.port == 443;
  if (options.port === 443 || options.port === 80) {
    options.serverAndPort = options.server;
  }else {
    options.serverAndPort = options.server + ':' + options.port;
  }

  if(options.compress === undefined) options.compress = true;

  var log4js = options.logger || require('log4js'),
      logger = log4js.getLogger('proxy<' + options.serverAndPort + '>'),
      encoder = require('./encodev2')(options);


  return function(req, res, next) {

    var logger = log4js.getLogger(req.method + ' ' + req.headers.host + req.url);
    logger.debug('handle request of ' + util.inspect(req.headers));

    req.encoder = encoder;
    req.options = options;
    req.plugins = options.plugins;

    makeRequest(req, res, next, logger);

  };

  function makeRequest(req, res, next, logger) {

    // -------- decode req and do request -----------
    var req_option = req.encoder.decodeRequest(req);

    if(!req_option) return next();

    var scheme;
    if(req_option.isSecure) {
      scheme = https;
    } else {
      scheme = http;
    }

    console.log('scheme isSecure %s', req_option.isSecure);
    console.log('decoded request options:')
    console.log(req_option);

    var clientRequest = scheme.request(req_option, function(clientResponse) {
        console.log('clientResponse callback');
        req.plugins.handle(req_option, clientResponse, req, res, next, logger);
    });

    // setTimeout, config it, long pull
    if(options.timeout) {

      var timeoutTimer = setTimeout(function() {
          clientRequest.abort()
          var e = new Error("ETIMEDOUT")
          e.code = "ETIMEDOUT"
          clientRequest.emit("error", e)
      }, options.timeout)

      clientRequest.on('end', function() {
          clearTimeout(timeoutTimer);
      });

    }

    clientRequest.on('error', function(err) {
        next(err);
    });

    decodeRequestBodyTo(req, clientRequest);

  }

  function decodeRequestBodyTo(req, clientRequest) {
    // TODO 是否要做成plugin形式, 可对不同网站自定义 post

    var postIsText = req.headers['content-type'] === 'application/x-www-form-urlencoded';
    var body;
    if (postIsText) {
      logger.debug('post is text, content-type: ' + req.headers['content-type']);
      body = '';
    }

    req.on('data', function(data) {
        if (postIsText && typeof data === 'string') {
          body += data;
        }else {
          clientRequest.write(data);
        }
    });

    req.on('end', function() {
        if (postIsText && body.length > 0) {
          logger.debug('post data is <' + body + '>');
          body = decodeQuery(body);
          logger.debug('decoded body is <' + body + '>');
          clientRequest.write(body);
        }
        clientRequest.end();
        console.log('clientRequest end');
    });

  }

};
