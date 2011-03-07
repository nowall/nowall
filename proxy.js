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
var Proxy = exports.Proxy = function(options) {

  this.server = options.server;
  this.port = options.port || 443;
  this.useHttps = options.useHttps === undefined ? this.port == 443 : true;
  if (this.port === 443 || this.port === 80) {
    this.serverAndPort = this.server;
  }else {
    this.serverAndPort = this.server + ':' + this.port;
  }

  this.hostPattern = new RegExp(
    '([a-z0-9\\-\\.]+)\\.(h|s)\\.' + //domain, schemeFlag
    this.serverAndPort.replace(/\./g, '\\.') +  //server
    '(\\/.*)?'); //path or not

};

Proxy.prototype.handle = function(req, res) {

  var options = this;
  var clientRequest = new ProxyRequest(options, req).request(
    function(clientResponse) {
      new ProxyResponse(options, clientResponse).write(res);
    });

  req.on('data', function(data) {
      clientRequest.write(data);
    });

  req.on('end', function() {
      clientRequest.end();
    });

};

/****************
 * common utils *
 ****************/

var RESPONSE_HOST_PATTERN =
  /([^\w])((https|http):\/\/)?([a-z0-9\-][a-z0-9\-\.]*\.[a-z]{2,4})([^\w\d])/g;

var LOCATION_URL_PATTERN =
  /((https|http):\/\/)?([a-z0-9\-][a-z0-9\-\.]*\.[a-z]{2-4})(\/.*)?/;

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
var ProxyRequest = function(options, request) {
  this.options = options;
  this._request = request;
};

ProxyRequest.prototype = {

  request: function(callback) {
    var options = {
      method: this._request.method,
      path: this._request.url,
      host: this.decodeHost(this._request.headers.host),
      port: this.port,
      headers: this.decodeHeaders(this._request.headers)
    };
    //sys.puts('request with options ' + sys.inspect(options));
    var request = this.scheme.request(options, callback);
    if (this._request.body) {
      request.write(this._request.body);
    }
    request.end();
    request.on('error', function(err) {
        sys.puts('client request error:' + sys.inspect(err));
      });
    return request;
  },

  decodeHost: function(host) {
    var match = this.options.hostPattern.exec(host);
    if (match) {
      this.scheme = match[2] === 's' ? https : http;
      this.port = match[2] === 's' ? 443 : 80;
      return match[1];
    }else {
      throw new Error('not a proxy request');
    }
  },

  decodeReferer: function(referer) {
    var match = referer.match(this.options.hostPattern);
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
      decodedHeader[name] = value;
    }
    return decodedHeader;
  }

};

/*****************
 * ProxyResponse *
 *****************/
var ProxyResponse = function(options, clientResponse) {
  this.options = options;
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
          sys.puts('error ocurse when unzip ' + sys.inspect(err));
        })
      .addListener('end', function() {
          zipStream.close();
        });

      zipStream.addListener('data' , function(data) {
          serverResponse.write(data.toString('binary'), 'binary');
        })
      .addListener('error', function(err) {
          sys.puts('error ocurse when zip ' + sys.inspect(err));
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
            serverResponse.write(that.decodeBody(chunk), charset);
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
    //sys.puts('response headers:\n' + sys.inspect(headers));
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
    //sys.puts('decodedHeaders:\n' + sys.inspect(decodedHeaders));
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
          that.options.serverAndPort +
          path +
          url_suffix;
        return result;
      });

    data = data.replace(CSS_URL_PATTERN,
      function(full, prefix, scheme, domain, path, suffix) {
        var result = prefix +
          'https://' + domain +
          (scheme === 'https' ? '.s.' : '.h.') +
          that.options.serverAndPort +
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

    if (is_secure && !this.options.useHttps)
        cookie = cookie.replace(secure_pattern, '$1HttpOnly$3');

    if (is_http && this.options.useHttps)
        cookie = cookie.replace(httponly_pattern, '$1Secure$3');

    var decodedCookies;

    if (domain) {
      if (is_secure) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.s.' + this.options.server + '$3')];
      }else if (is_http) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.h.' + this.options.server + '$3')];
      }else {
        decodedCookies =
          [
            cookie.replace(domain_pattern, '$1$2.s.' + this.options.server + '$3'),
            cookie.replace(domain_pattern, '$1$2.h.' + this.options.server + '$3')
          ];
      }
    }else {
      decodedCookies = [cookie];
    }

    return decodedCookies;
  },

  decodedLocation: function(location) {
    var match = LOCATION_URL_PATTERN.exec(location);
    if (match) {
      return 'https://' + match[3] +
        match[2] === 'https' ? '.s.' : '.h.' +
        this.options.serverAndPort +
        match[4] || '';
    }
    return location;
  }

};

