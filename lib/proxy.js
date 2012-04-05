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
*/
var proxy = module.exports = function(options) {

  options.port = options.port || 443;
  options.useHttps = options.useHttps || this.port == 443;
  options.compress = options.compress || false;
  if (options.port === 443 || options.port === 80) {
    options.serverAndPort = options.server;
  }else {
    options.serverAndPort = options.server + ':' + options.port;
  }

  var log4js = options.logger || require('log4js')(),
      logger = log4js.getLogger('proxy<' + options.serverAndPort + '>'),
      encode = require('./encode')(options),
      encodeHost = encode.encodeHost,
      decodeHost = encode.decodeHost,
      encodeScript = encode.encodeScript,
      encodeBody = encode.encodeBody,
      decodeQuery = encode.decodeQuery,
      decodePathAndQuery = encode.decodePathAndQuery;


  var handle = function(req, res) {

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

    var clientRequest = new ProxyRequest(logger, req).request(
      function(clientResponse) {
        try {
          new ProxyResponse(logger, clientResponse).write(res);
        } catch (e) {
          logger.error('error when handle proxy', e);
        }
    });

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
    });

  };

  /****************
  *   patterns   *
  ****************/
  var _pServerAndPort = options.serverAndPort.replace(/\./g, '\\.');

  var HOST_PATTERN = new RegExp(
    '^(https://|http://|)([\\w\\d\\-\\.]+)\\.' + //domain
    _pServerAndPort +  //server
    '(\\/https?)?(\\/.*)?', 'i'); //schemeFlag, path or not
  logger.debug('pServerAndPort is <' + _pServerAndPort + '>');
  logger.debug('HOST_PATTERN is <' + HOST_PATTERN + '>');

  var RESPONSE_HOST_PATTERN =
  /([^\w])((https|http):\/\/)?([\w0-9\-][\w0-9\-\.]*\.[\w]{2,4})([^\w\d])/g;

  var LOCATION_URL_PATTERN =
  /((https|http):\/\/)?([\w\d\-][\w\d\-\.]*\.[\w]{2,4})(\/.*)?/;

  var encodeLocation = function(location) {
    var match = LOCATION_URL_PATTERN.exec(location);
    if (match) {
      logger.info(options.serverAndPort);
      return (options.useHttps ? 'https://' : 'http://') +
      encodeHost(match[3]) + '.' + options.serverAndPort +
      (match[2] === 'https' ? '/https' : '/http') + (match[4] || '');
    }
    return location;
  }

  /****************
  * ProxyRequest *
  ****************/
  var ProxyRequest = function(logger, request) {
    this._request = request;
    this.logger = logger;
    this.action = this._request.method + ' ';
    this._request.headers.host + this._request.url;
  };

  ProxyRequest.prototype = {

    request: function(callback) {
      var _options = {
        method: this._request.method,
        host: this.decodeHost(this._request.headers.host),
        headers: this.decodeHeaders(this._request.headers)
      };
      var _url = this._request.url;
      logger.debug('_url is ' + _url);
      var match = /\/(https?)(\d*)(.*)/i.exec(_url);
      if (match) {
        if (match[1] === 'https') {
          this.scheme = https;
          _options.port = match[2] || 443;
        }else {
          this.scheme = http;
          _options.port = match[2] || 80;
        }
        _options.path = match[3];
      }else {
        //TODO: use refererance scheme;
        this.scheme = http;
        _options.port = 80;
        _options.path = _url;
      }
      _options.path = decodePathAndQuery(_options.path);

      var that = this;
      this.logger.debug('encodedRequest ' + util.inspect(_options));
      var request = this.scheme.request(_options, callback);
      request.on('error', function(err) {
          that.logger.error('client request error:', err);
      });
      return request;
    },

    decodeHost: function(host) {
      var match = HOST_PATTERN.exec(host);
      if (match) {
        return decodeHost(match[2]);
      }else {
        throw new Error(host + ' is not a proxy request');
      }
    },

    decodeReferer: function(referer) {
      return referer.replace(HOST_PATTERN, function(full, scheme, domain, _, suffix) {
          if (!this.refScheme) {
            this.refScheme = scheme;
          }
          return scheme + decodeHost(domain) + (suffix && decodePathAndQuery(suffix) || '');
      });
    },

    decodeHeaders: function(headers) {
      var decodedHeader = {};
      for (var name in headers) {
        var value = headers[name];
        var lname = name.toLowerCase();
        if (lname === 'host') {
          continue;
        }else if (lname === 'referer' || lname === 'origin') {
          value = this.decodeReferer(value);
        }
        //else if(lname === 'cookie') {
        //}
        else if (lname === 'accept-encoding') {
          if (options.compress === false)
            continue;
          if (value.indexOf('gzip') >= 0)
            value = 'gzip';
        }
        decodedHeader[name] = value;
      }
      return decodedHeader;
    }

  };

  /*****************
  * ProxyResponse *
  *****************/
  var ProxyResponse = function(logger, clientResponse) {
    this.logger = logger;
    this.response = clientResponse;
    this.headers = this.decodeHeaders(this.response.headers);
  };

  ProxyResponse.prototype = {
    write: function(serverResponse) {
      var that = this;

      var contentType = this.response.headers['content-type'];
      var isText = contentType && /(text|javascript)/.test(contentType);
      var isScript = contentType && /javascript/.test(contentType) ||
                     (isText && ! /text\/(css|html)/.test(contentType)) ;
      logger.info('contentType:' + contentType + " isScript:"+isScript);
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

      var zipStream, unzipStream;
      if (contentEncoding === 'gzip') {
        zipStream = new compressor.GzipStream();
        unzipStream = new compressor.GunzipStream();
      }else if (contentEncoding === 'bzip') {
        zipStream = new compressor.BzipStream();
        unzipStream = new compressor.BunzipStream();
      }

      var bufferLenght, buffers, body;
      if (isText) {
        buffers = [];
        bufferLenght = 0;
        body = '';
      }else {
        this.logger.debug('decodedHeaders:\n' + util.inspect(this.headers));
        serverResponse.writeHead(
          this.response.statusCode,
          this.headers
        );
      }
      if (zipStream) {
        /*
        zipStream.setEncoding('binary');
        zipStream.setInputEncoding(encoding);
        unzipStream.setInputEncoding('binary');
        unzipStream.setEncoding(encoding);
        */

        unzipStream.addListener('data', function(data) {
            body += data;
        })
        .addListener('error', function(err) {
            that.logger.error('error ocurse when unzip ', err);
        })
        .addListener('end', function() {
            body = encodeBody(body, isScript);
            delete that.headers['content-length'];
            that.logger.debug('decodedHeaders:\n' + util.inspect(that.headers));
            serverResponse.writeHead(
              that.response.statusCode,
              that.headers
            );
            zipStream.write(body);
            zipStream.close();
        });

        zipStream.addListener('data' , function(data) {
            serverResponse.write(data);
        })
        .addListener('error', function(err) {
            that.logger.error('error ocurse when zip ', err);
        })
        .addListener('end', function() {
            serverResponse.end();
        });
      }

      this.response.on('data', function(chunk) {
          if (isText) {
            if (unzipStream) {
              unzipStream.write(chunk);
            }else {
              buffers.push(chunk);
              bufferLenght += chunk.length;
            }
          }else {
            try{
              serverResponse.write(chunk);
            }catch(e){
              logger.error('error when write to response', e);
            }
          }
      });

      this.response.on('end', function() {
          if (isText) {
            if (unzipStream) {
              return unzipStream.close();
            }else {
              var buffer = new Buffer(bufferLenght);
              for (var i = 0, offset = 0; i < buffers.length; i++) {
                buffers[i].copy(buffer, offset);
                offset += buffers[i].length;
              }
              var body = buffer.toString(encoding);
              body = encodeBody(body, isScript);
              delete that.headers['content-length'];
              that.logger.debug('decodedHeaders:\n' + util.inspect(that.headers));
              try{
                serverResponse.writeHead(
                  that.response.statusCode,
                  that.headers
                );
                serverResponse.write(body, encoding);
              }catch(e){
                logger.error('error when write to response', e);
              }
            }
          }
          serverResponse.end();
      });

    },

    decodeHeaders: function(headers) {
      this.logger.debug('raw headers:\n' + util.inspect(headers));
      var decodedHeaders = {};
      for (var name in headers) {
        var lname = name.toLowerCase();
        var value = headers[name];
        if (lname === 'set-cookie') {
          value = this.decodeCookies(value);
        }else if (lname === 'location') {
          value = encodeLocation(value);
        }else if (lname === 'status') {
          continue;
        }
        decodedHeaders[name] = value;
      }
      return decodedHeaders;
    },

    decodeCookies: function(cookies) {
      var decodedCookies = [];
      for (var i = 0; i < cookies.length; i++) {
        var oneCookies = this.decodeCookie(cookies[i]);
        decodedCookies[decodedCookies.length] = oneCookies[0];
        if (oneCookies[1]) {
          decodedCookies[decodedCookies.length] = oneCookies[1];
        }
      }
      return decodedCookies;
    },

    decodeCookie: function(cookie) {
      var domain_pattern = /([;^]?\s*domain=)([^;]*)([;$]?)/i,
          secure_pattern = /([;^]?\s*)(secure)([;$]?)/i,
          httponly_pattern = /([;^]?\s*)(httponly)([;$]?)/i;

      var is_http = httponly_pattern.exec(cookie),
          is_secure = secure_pattern.exec(cookie),
          has_domain = domain_pattern.exec(cookie),
          domain = has_domain && has_domain[2];

      if (is_secure && !options.useHttps)
        cookie = cookie.replace(secure_pattern, '$1HttpOnly$3');

      if (is_http && options.useHttps)
        cookie = cookie.replace(httponly_pattern, '$1Secure$3');

      var decodedCookies;
      /*
      function secure_replace_domain() {
        return cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
            return prefix + encodeHost(domain) + '.s.' + options.server + suffix;
        });
      }

      function normal_replace_domain() {
        return cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
            return prefix + encodeHost(domain) + '.h.' + options.server + suffix;
        });
      }
      */
      if (domain) {
        decodedCookies = [
          cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
              return prefix + encodeHost(domain) + '.' + options.server + suffix;
          })
        ];
        /*
        if (is_secure) {
          decodedCookies =
          [secure_replace_domain()];
        }else if (is_http) {
          decodedCookies =
          [normal_replace_domain()];
        }else {
          decodedCookies =
          [
            secure_replace_domain(),
            normal_replace_domain()
          ];
        }
        */
      }else {
        decodedCookies = [cookie];
      }

      return decodedCookies;
    }

  };

  handle.encodeLocation = encodeLocation;

  return handle;

};
