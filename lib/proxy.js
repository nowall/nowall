/**
 * @author: guileen@gmail.com
 */

//TODO: More test
//TODO: User controll
//TODO: better logger

var https = require('https'),
    http = require('http'),
    compressor = require('compressor'),
    sys = require('sys');

/**
 * options : server, port, useHttps
 */
module.exports = function(options) {

options.port = options.port || 443;
options.useHttps = options.useHttps === undefined ? this.port == 443 : true;
options.compress = options.compress || false;
if (options.port === 443 || options.port === 80) {
  options.serverAndPort = options.server;
}else {
  options.serverAndPort = options.server + ':' + options.port;
}
var log4js = options.logger || require('log4js')(),
    logger = log4js.getLogger('proxy<'+options.serverAndPort+'>')

var handle = function(req, res) {

  var logger = log4js.getLogger(req.method + ' ' + req.headers.host + req.url);
  var clientRequest = new ProxyRequest(logger, req).request(
    function(clientResponse) {
      try {
        new ProxyResponse(logger, clientResponse).write(res);
      } catch (e) {
        logger.error('error when handle proxy', e);
      }
  });

  req.on('data', function(data) {
      clientRequest.write(data);
  });

  req.on('end', function() {
      clientRequest.end();
  });

};

/****************
 *   patterns   *
 ****************/
var _pServerAndPort = options.serverAndPort.replace(/\./g, '\\.');

var HOST_PATTERN = new RegExp(
  '([\\w\\d\\-\\.]+)\\.(h|s)\\.' + //domain, schemeFlag
  _pServerAndPort +  //server
  '(\\/.*)?'); //path or not
logger.debug('pServerAndPort is <' + _pServerAndPort+'>');
logger.debug('HOST_PATTERN is <' + HOST_PATTERN + '>');

var RESPONSE_HOST_PATTERN =
  /([^\w])((https|http):\/\/)?([\w0-9\-][\w0-9\-\.]*\.[\w]{2,4})([^\w\d])/g;

var LOCATION_URL_PATTERN =
  /((https|http):\/\/)?([\w\d\-][\w\d\-\.]*\.[\w]{2,4})(\/.*)?/;

var SRC_URL_PATTERN = new RegExp(
    "(\\s|\\.|\\,|'|\")" + // attr_pref
    "(src|href|action|embed|url|server)(['\"]?\\s*[=:]\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    "(http|https|)://([^/'\"]+)" +//scheme, domain
    "(/?[^'\"]*)('|\"|&#39;|&apos;|&quot;)", //path, url_suffix
  'ig'
);

//prefix, scheme, domain, path, suffix
var CSS_URL_PATTERN =
  /(\(\s*['"]?\s*)(http|https|):?\/\/([^\/]*)(\/[^\)]*?)(\s*['\"]?\s*\))/ig;

//TODO: var FACEBOOK_PATTERN = http:\/\/www\.google\.com\/

/****************
 * ProxyRequest *
 ****************/
var ProxyRequest = function(logger, request) {
  this._request = request;
  this.logger = logger;
  this.action = this._request.method + ' '
                this._request.headers.host + this._request.url;
};

ProxyRequest.prototype = {

  request: function(callback) {
    var _options = {
      method: this._request.method,
      path: this._request.url,
      host: this.decodeHost(),
      port: this.port,
      headers: this.decodeHeaders(this._request.headers)
    };
    var that = this;
    this.logger.debug('raw request '  + sys.inspect(this._request.headers));
    this.logger.debug('encodedRequest ' + sys.inspect(_options));
    var request = this.scheme.request(_options, callback);
    if (this._request.body) {
      request.write(this._request.body);
    }
    request.end();
    request.on('error', function(err) {
        that.logger.error('client request error:', err);
    });
    return request;
  },

  decodeHost: function() {
    var match = HOST_PATTERN.exec(host);
    if (match) {
      this.scheme = match[2] === 's' ? https : http;
      this.port = match[2] === 's' ? 443 : 80;
      return match[1];
    }else {
      throw new Error(host + ' is not a proxy request');
    }
  },

  decodeReferer: function(referer) {
    var match = referer.match(HOST_PATTERN);
    if (match) {
      var scheme = match[2] === 's' ? 'https' : 'http';
      //host = match[1], path = match[3]
      return scheme + '://' + match[1] + (match[3] || '');
    } else {
      console.log('error to parse referer');
      return '';
    }
  },

  decodeHeaders: function(headers) {
    var decodedHeader = {};
    for (var name in headers) {
      var value = headers[name];
      var lname = name.toLowerCase();
      if (lname === 'host') {
        continue;
      }else if (lname === 'referer') {
        value = this.decodeReferer(value);
      }
      //else if(lname === 'cookie') {
      //}
      else if (options.compress === false && lname === 'accept-encoding') {
        continue;
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
    serverResponse.writeHead(
      this.response.statusCode,
      this.headers
    );
    var that = this;

    var contentType = this.response.headers['content-type'];
    var isText = contentType && contentType.match(/(text|javascript)/);
    var contentEncoding = this.response.headers['content-encoding'];
    var charset = /charset=([\w\d\-]+)/.exec(contentType);
    charset = charset && charset[1] || 'utf8';

    var zipStream, unzipStream;
    if (contentEncoding === 'gzip') {
      zipStream = new compressor.GzipStream();
      unzipStream = new compressor.GunzipStream();
    }else if (contentEncoding === 'bzip') {
      zipStream = new compressor.BzipStream();
      unzipStream = new compressor.BunzipStream();
    }

    if (zipStream) {
      zipStream.setEncoding('binary');
      zipStream.setInputEncoding(charset);
      unzipStream.setInputEncoding('binary');
      unzipStream.setEncoding(charset);

      unzipStream.addListener('data', function(data) {
          var decodedBody = that.decodeBody(data.toString());
          zipStream.write(decodedBody);
      })
      .addListener('error', function(err) {
          that.logger.error('error ocurse when unzip ',err);
      })
      .addListener('end', function() {
          zipStream.close();
      });

      zipStream.addListener('data' , function(data) {
          serverResponse.write(data.toString('binary'), 'binary');
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
            serverResponse.write(that.decodeBody(chunk.toString()), charset);
          }
        }else {
          serverResponse.write(chunk);
        }
    });

    this.response.on('end', function() {
        if (isText && unzipStream) {
          unzipStream.close();
        }else {
          serverResponse.end();
        }
    });

  },

  decodeHeaders: function(headers) {
    this.logger.debug('raw headers:\n' + sys.inspect(headers));
    var decodedHeaders = {};
    for (var name in headers) {
      var lname = name.toLowerCase();
      var value = headers[name];
      if (lname === 'set-cookie') {
        value = this.decodeCookies(value);
      }else if (lname === 'location') {
        value = this.decodeLocation(value);
      }else if (lname === 'status') {
        continue;
      }
      decodedHeaders[name] = value;
    }
    this.logger.debug('decodedHeaders:\n' + sys.inspect(decodedHeaders));
    return decodedHeaders;
  },

  decodeBody: function(data) {
    var that = this;
    var data = data.replace(SRC_URL_PATTERN,
      function(full, attr_prefix, attr, attr_suffix, 
          url_prefix, scheme, domain, path, url_suffix) {
        var result = attr_prefix + attr + attr_suffix + url_prefix +
          'https://' + domain +
          (scheme === 'https' ? '.s.' : '.h.') +
          options.serverAndPort +
          path +
          url_suffix;
        return result;
    });

    data = data.replace(CSS_URL_PATTERN,
      function(full, prefix, scheme, domain, path, suffix) {
        var result = prefix +
          'https://' + domain +
          (scheme === 'https' ? '.s.' : '.h.') +
          options.serverAndPort +
          path +
          suffix;
        return result;
    });

    return data;
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

    if (domain) {
      if (is_secure) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.s.' + options.server + '$3')];
      }else if (is_http) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.h.' + options.server + '$3')];
      }else {
        decodedCookies =
          [
            cookie.replace(domain_pattern, '$1$2.s.' + options.server + '$3'),
            cookie.replace(domain_pattern, '$1$2.h.' + options.server + '$3')
          ];
      }
    }else {
      decodedCookies = [cookie];
    }

    return decodedCookies;
  },

  decodeLocation: function(location) {
    var match = LOCATION_URL_PATTERN.exec(location);
    console.dir(match);
    if (match) {
      return 'https://' + match[3] +
        (match[2] === 'https' ? '.s.' : '.h.') +
        options.serverAndPort +
        (match[4] || '');
    }
    return location;
  }

};

return handle;

};
