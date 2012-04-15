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
    zlib = require('zlib'),
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
      encode = require('./encodev2')(options),
      decodeRequest = encode.decodeRequest,
      encodeUrl = encode.encodeUrl,
      decodeUrl = encode.decodeUrl,
      encodeHost = encode.encodeHost,
      decodeHost = encode.decodeHost
      encodeScript = encode.encodeScript,
      encodeBody = encode.encodeBody,
      decodeQuery = encode.decodeQuery,
      decodePathAndQuery = encode.decodePathAndQuery;


  var handle = function(req, res, next) {

    var logger = log4js.getLogger(req.method + ' ' + req.headers.host + req.url);
    logger.debug('handle request of ' + util.inspect(req.headers));

    if (req.headers.host === 'search.' + options.serverAndPort) {
      if (req.method.toLowerCase() === 'get') {
        return res.end('<!DOCTYPE html><html><head><title>Transport</title></head><form method="post"><input name="url" required><input type="submit"></form></html>');
      }else {
        var body = '';
        req.on('data', function(data) {
            body += data.toString();
        });

        req.on('end', function() {
            logger.debug('end. body is <' + body + '>');
            var url = querystring.parse(body).url;
            if (url == null) {
              return res.end('<!DOCTYPE html><html><head><title>Transport</title></head><form method="post"><input name="url" required><input type="submit"></form></html>');
            } else if (!/^https?:\/\/.*/.test(url)) {
              url = 'http://' + url;
            }
            logger.debug('encodedUrl is <' + encodeLocation(url) + '>');

            res.writeHead(302, {
                Location: encodeLocation(url)
            });

            res.end();
        });

        return;
      }
    }

    // -------- decode req and do request -----------
    var req_option = decodeRequest(req);

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
        try {
          var pres = new ProxyResponse(clientResponse, req_option, encode, logger);
          pres.write(res);
        } catch (e) {
          return next(e)
        }
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
    // ------------ end clientRequest ---------------

    //TODO: only for google login ?
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

  };

  return handle;

};


  /*****************
   * ProxyResponse *
   *****************/
  function ProxyResponse (clientResponse, clientRequestOptions, encode, logger) {
    this.logger = logger;
    this.response = clientResponse;
    console.log('raw response:')
    console.log(this.response.headers)
    this.headers = encode.encodeResponseHeaders(this.response.headers, clientRequestOptions);
    this.clientRequestOptions = clientRequestOptions;
  };

  ProxyResponse.prototype = {
    write: function(serverResponse) {
      var that = this;

      var contentType = this.response.headers['content-type'];
      var isText = contentType && /(text|javascript)/.test(contentType);
      var isScript = contentType && /javascript/.test(contentType) ||
                     (isText && ! /text\/(css|html)/.test(contentType)) ||
                     /\.js(\?|#|$)/.test(this.clientRequestOptions.path);
      isText = isText || isScript;
      this.logger.info('contentType:' + contentType + " isScript:"+isScript);
      var contentEncoding = this.response.headers['content-encoding'];
      var contentLength = Number(this.response.headers['content-length']);
      var charset = /charset=([\w\d\-]+)/.exec(contentType);
      charset = charset && charset[1] || 'utf8';
      var encoding;
      if ('ascii' === charset || 'utf8' === charset || 'utf-8' === charset) {
        encoding = charset;
      }else {
        encoding = 'binary';
      }

      delete this.headers['content-length'];
      serverResponse.writeHead(
        this.response.statusCode,
        this.headers
      );
      // if binary simply pipe response
      if(!isText) {
        return this.response.pipe(serverResponse);
      }

      var response = this.response
      var zipStream;

      switch (contentEncoding) {
        // or, just use zlib.createUnzip() to handle both cases
        case 'gzip':
          response = response.pipe(zlib.createGunzip());
          zipStream = zlib.createGzip();
          break;
        case 'deflate':
          response.pipe(zlib.createInflate());
          zipStream = zlib.createDeflate();
          break;
        default:
          if(contentEncoding)
            logger.error('unsupported content-encoding: <%s>', contentEncoding);
          break;
      }

      if(zipStream) {
          zipStream.pipe(serverResponse);
          serverResponse = zipStream;
      }

      var bufferLenght, buffers, body;
        buffers = [];
        bufferLenght = 0;
        body = '';

      response.on('error', function(err) {
          logger.error(err);
          serverResponse.end();
      });

      response.on('data', function(chunk) {
          buffers.push(chunk);
          bufferLenght += chunk.length;
      });

      response.on('end', function() {
          var buffer = new Buffer(bufferLenght);
          for (var i = 0, offset = 0; i < buffers.length; i++) {
            buffers[i].copy(buffer, offset);
            offset += buffers[i].length;
          }
          var body = buffer.toString(encoding);
          body = encodeBody(body, isScript);
          that.logger.debug('decodedHeaders:\n' + util.inspect(that.headers));
          try{
            // serverResponse.write(body, encoding);
            // zipStream must write buffer
            serverResponse.write(new Buffer(body, encoding));
          }catch(e){
            logger.error('error when write to response', e);
          }
          serverResponse.end();
      });

    }

  };
