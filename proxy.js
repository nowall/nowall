/**
 * @author: guileen@gmail.com
 */
/**********
 * config *
 **********/
var SERVER_NAME_AND_PORT = SERVER_NAME = 'dev';
var SERVER_PORT = 8000;
var USE_HTTPS = 'ALWAYS'; // AUTO, NEVER

if (SERVER_PORT != 443)
  SERVER_NAME_AND_PORT += ':' + SERVER_PORT;
/********
 * main *
 ********/
var https = require('https'),
  http = require('http'),
  compressor = require('compressor'),
  sys = require('sys'),
  fs = require('fs');

var options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt')
};

https.createServer(options, function(serverRequest, serverResponse) {
  var clientRequest = new ProxyRequest(serverRequest).request(
    function(clientResponse) {
      new ProxyResponse(clientResponse).write(serverResponse);
    });

  serverRequest.on('data', function(data) {
      clientRequest.write(data);
    });

  serverRequest.on('end', function() {
      clientRequest.end();
    });

}).listen(SERVER_PORT);

/****************
 * common utils *
 ****************/

var REQUEST_HOST_PATTERN = new RegExp(
  '([a-z0-9\\-\\.]+)\\.(h|s)\\.' + //domain, schemeFlag
  SERVER_NAME_AND_PORT.replace(/\./g, '\\.') +  //server
  '(\\/.*)?'); //path or not

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
  'i'
);

//prefix, scheme, domain, path, suffix
var CSS_URL_PATTERN =
  / (\(\s * ['"]?\s*)(http|https|):?//([^\/]*)(\/[^\)]*?)(\s*['\']?\s*\))/i

//TODO: var FACEBOOK_PATTERN = http:\/\/www\.google\.com\/

/****************
 * ProxyRequest *
 ****************/
var ProxyRequest = function(request) {
  this._request = request;
};

ProxyRequest.prototype = {

  request: function(callback) {
    var options = {
      method: this._request.method,
      url: this._request.url,
      host: this.decodeHost(this._request.headers.host),
      port: this.port,
      headers: this.decodeHeaders(this._request.headers)
    };
    sys.puts('request with options ' + sys.inspect(options));
    return this.scheme.request(options, callback);
  },

  decodeHost: function(host) {
    var match = REQUEST_HOST_PATTERN.exec(host);
    this.scheme = match[2] === 's' ? https : http;
    this.port = match[2] === 's' ? 443 : 80;
    return match[1];
  },

  decodeReferer: function(referer) {
    var match = referer.match(REQUEST_HOST_PATTERN.search);
    if (match) {
      var scheme = match[2] === 's' ? https : http;
      //host = match[1], path = match[3]
      return scheme + '://' + match[1] + match[3];
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
      //else if(lname === 
'
cookie
'
) {
      //}
      decodedHeader[name] = value;
    }
    return decodedHeader;
  }

};

/*****************
 * ProxyResponse *
 *****************/
var ProxyResponse = function(clientResponse) {
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

    sys.puts(sys.inspect('contentType is:' + contentType));
    sys.puts(sys.inspect('isText is :' + isText));
    sys.puts(sys.inspect('contentEncoding is:' + contentEncoding));
    sys.puts(sys.inspect('charset is:' + charset));

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
          sys.puts('unzipStream on data');
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
          sys.puts('zipStream on data');
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
          serverResponse.write(data);
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
    sys.puts('response headers:\n' + sys.inspect(headers));
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
    sys.puts('decodedHeaders:\n' + sys.inspect(decodedHeaders));
    return decodedHeaders;
  },

  decodeBody: function(data) {
    return data.replace(RESPONSE_HOST_PATTERN,
      function(full, prefix, fullScheme, scheme, domain, suffix) {
        sys.puts('match:' + full);
        sys.puts('prefix:' + prefix);
        sys.puts('fullScheme:' + fullScheme);
        sys.puts('scheme:' + scheme);
        sys.puts('domain:' + domain);
        sys.puts('suffix:' + suffix);
        if (fullScheme === undefined) {
          return prefix + domain + '.h.' + SERVER_NAME_AND_PORT + suffix;
        }else {
          return prefix + 'https://' + domain +
            scheme === 'https' ? '.s.' : '.h.' +
            SERVER_NAME_AND_PORT +
            suffix;
        }
      });
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

    if (is_secure && USE_HTTPS === 'NEVER')
        cookie = cookie.replace(secure_pattern, '$1HttpOnly$3');

    if (is_http && USE_HTTPS === 'ALWAYS')
        cookie = cookie.replace(httponly_pattern, '$1Secure$3');

    var decodedCookies;

    if (domain) {
      if (is_secure) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.s.' + SERVER_NAME + '$3')];
      }else if (is_http) {
        decodedCookies =
          [cookie.replace(domain_pattern, '$1$2.h.' + SERVER_NAME + '$3')];
      }else {
        decodedCookies =
          [
            cookie.replace(domain_pattern, '$1$2.s.' + SERVER_NAME + '$3'),
            cookie.replace(domain_pattern, '$1$2.h.' + SERVER_NAME + '$3')
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
        SERVER_NAME_AND_PORT +
        match[4] || '';
    }
    return location;
  }

};

