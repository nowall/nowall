var querystring = require('querystring');

/**
 * v1 : http://qqq-www-zye.nowall.be
 * v2 : https://nowall.be/?px!=www.t.cn
 * options
 *    baseURL
 *
 */
module.exports = function(options) {

  var _pServerAndPort = options.serverAndPort.replace(/\./g, '\\.');
  var HOST_PATTERN = new RegExp(
    '^(https://|http://|)([\\w\\d\\-\\.]+)\\.' + //domain
    _pServerAndPort +  //server
    '(\\/https?)?(\\/.*)?', 'i'); //schemeFlag, path or not

  // 注意 因为nowall.be 的域名后缀不是.com,net,org,edu,才可以这么做，否则会多次替换
  var ROOT_HOST_PATTERN_0 = /([^\w\d\-]|^)(([\d\w\-]+)(\\?\.)(com|net|org|edu)(\.\w{2})?)([^\w\d\-\.]|$)/ig;
  var ROOT_HOST_PATTERN_1 = /([^\w\d\-]|^)([\d\w\-]+\.\w{2,4}(\.\w{2})?)([^\w\d\-\.]|$)/;

  var BASE_MAP = '0123456789abcdefghijklmnopqrstuvwxyz',
      ENCODE_MAP = 'abcdefghijklmnopqrstuvwxyz0123456789';

  var SRC_URL_PATTERN = new RegExp(
    "(\\s|\\.|\\,|'|\")" + // attr_pref
    "(src|href|action|embed|url|server)(['\"]?\\s*[=:]\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    "(http|https|)://([^/'\"]+)" +//scheme, domain
    "(/?[^'\"]*)('|\"|&#39;|&apos;|&quot;)", //path, url_suffix
    'ig'
  );

  var DOMAIN_ATTR_PATTERN = /(document.domain\s*=\s*['"])([\w\d\-\.]+)(['"])/ig;

  //prefix, scheme, domain, path, suffix
  var CSS_URL_PATTERN =
  /(\(\s*['"]?\s*)(http|https|):?\/\/([\w\d\.\-\\]+\.\w{2,4})(\/[^\)]*?)(\s*['\"]?\s*\))/ig;

  // ------------------ v1 --------------------

  var decode = function(host) {
    host = host.toLowerCase();
    var result = '';
    for (var i = 0, len = host.length; i < len; i++) {
      var index = ENCODE_MAP.indexOf(host[i]);
      if (index >= 0) {
        result += BASE_MAP[index];
      }else {
        result += host[i];
      }
    }
    return result;
  }

  var encode = function(host) {
    host = host.toLowerCase();
    var result = '';
    for (var i = 0, len = host.length; i < len; i++) {
      var index = BASE_MAP.indexOf(host[i]);
      if (index >= 0) {
        result += ENCODE_MAP[index];
      }else {
        result += host[i];
      }
    }
    return result;
  }

  var encodeHost = function(host) {
    return host.replace(ROOT_HOST_PATTERN_1, function(full, prefix, root, _, suffix) {
        root = root.replace(/-/g, '--');
        root = root.replace(/\./g, '-');
        root = encode(root);
        return (prefix || '') + root + (suffix || '');
    });
  }

  var decodeHost = function(host) {
    parts = host.split('.');
    root = parts.pop();
    root = root.replace(/--/g, '**');
    root = root.replace(/-/g, '.');
    root = root.replace(/\*\*/g, '-');
    if (parts.length == 0)
      return decode(root);
    return parts.join('.') + '.' + decode(root);
  }

  var encodeScript = function(body) {
    return body.replace(ROOT_HOST_PATTERN_0, function(full, prefix, root, _, sep, _, _, suffix) {
        root = root.replace(/-/g, '--');
        root = root.replace(/\./g, '-');
        root = encode(root);
        return (prefix || '') + root + sep + options.serverAndPort + (suffix || '');
    });
  }
  // ------------------------ end v1 ----------------------

  var encodeBody = function(data, isScript, debug) {
    var that = this;
    var data = data.replace(SRC_URL_PATTERN,
      function(full, attr_prefix, attr, attr_suffix,
        url_prefix, scheme, domain, path, url_suffix) {

        var result = attr_prefix + attr + attr_suffix + url_prefix +
                     /* -- attr_value -- */
                     encodeUrl(scheme + '://' + domain + path) +
                     // (options.useHttps ? 'https://' : 'http://') +
                     // encodeHost(domain) + '.' + options.serverAndPort +
                     // (scheme === 'https' ? '/https' : '/http') +
                     url_suffix;
        + url_suffix;
        if (debug) {
          console.log('==========SRC match<' + full + '>=============');
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });
    data = data.replace(CSS_URL_PATTERN,
      function(full, prefix, scheme, domain, path, suffix) {
        var result = prefix +
                     encodeUrl((scheme || 'http') + '://' + domain + path) +
                     // (options.useHttps ? 'https://' : 'http://') +
                     // encodeHost(domain) + '.' + options.serverAndPort +
                     // (scheme === 'https' ? '/https' : '/http') +
                     path + suffix;
        if (debug) {
          console.log('==========CSS match<' + full + '>=============');
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    data = data.replace(DOMAIN_ATTR_PATTERN, function(full, prefix, domain, suffix) {
        return full;
        // var result = prefix + encodeHost(domain) + '.' + options.server + suffix;
        // if (debug) {
        //   console.log('=======DOMAIN match<' + full + '>=============');
        //   console.log('==========result is<' + result + '>=============');
        // }
        // return result;
    });

    if (isScript) {
      data = encodeScript(data, options);
    } else {
      // ([\s\S]*?) non-greedy dotall search
      data = data.replace(/(<script\s?[^>]*>)([\s\S]*?)(<\/script>)/g,
        function(full, prefix, script, suffix) {
          if (debug) {
            console.log('======Script match<' + script + '>=======');
          }
          return prefix + encodeScript(script) + suffix;
        }
      );
    }

    return data;
  }

  var decodeQuery = function(query) {
    if (!query) return '';
    query = querystring.parse(query);
    for (var name in query) {
      query[name] = query[name].replace(HOST_PATTERN,
        function(full, scheme, domain, _, suffix) {
          return scheme + decodeHost(domain) + (suffix || '');
      });
    }
    return querystring.stringify(query);
  }

  var decodePathAndQuery = function(path) {
    return path.replace(/([^\?]*)((\?)([^\?]*))?/, function(full, path, _, sep, query) {
        return (path || '') + (sep || '') + decodeQuery(query);
    });
  }


  // =================== encode v2 =============

  var baseURL = options.baseURL;
  var whiteList = options.whiteList;
  var _pBaseURL = baseURL.replace(/\./g, '\\.');

  /**
   * very simple url parser
   */
  function parseUrl (url) {
    //       ht[1] ://   t.cn:80[3]   :port[4] /path[5]   ?query[6] #anchor[7]
    var r = /^(\w+):\/\/(([^\/\?#:]+)(:\d+)?)(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url);
    return r && {
      scheme : r[1]
    , domain : r[3]
    , port: r[4] && parseInt(r[4].substring(1))
    , path : r[5] || '/'
    , querystring : r[6] || ''
    , anchor : r[7] || ''
    , root : r[1] + '://' + r[2]
    , pathquery : (r[5] || '/') + (r[6] || '')
    };
  }

  /**
   * full url
   *
   */
  function encodeFullUrl(url) {
    var parts = parseUrl(url);
    for(var i in whiteList) {
      var w = whiteList[i];
      var domain = parts.domain;
      if(domain.lastIndexOf(w) == domain.length - w.length)
        return url;
    }
    if(parts) {
      return baseURL + parts.pathquery
        + (parts.querystring ? '&' : '?')
        + 'px!=' + parts.root
        + parts.anchor;
    }
  }

  /**
   * /path?query#anchor
   *
   */
  function encodeUrlPath(url, reqOptions) {
    var index = url.indexOf('#')
    var scheme = reqOptions.isSecure ? 'https' : 'http';
    var port = (reqOptions.isSecure && reqOptions.port == 443 || reqOptions == 80 ) ? '' : ':' + reqOptions.port;
    return encodeFullUrl(scheme + '://' + reqOptions.host + port + url);
  }

  function encodeUrl(url, reqOptions) {
    return (/^https?:\/\//.test(url)) ? encodeFullUrl(url) : encodeUrlPath(url, reqOptions);
  }

  /**
   * url '/?px!=baseurl#anchor'
   *
   */
  function parseEncodedUrl(url) {

    // a little faster parser
    var index = url.lastIndexOf('#');
    var anchor, pathquery;
    if(index >= 0) {
      anchor = url.substring(index);
      pathquery = url.substring(0, index);
    } else {
      anchor = '';
      pathquery = url;
    }

    index = url.lastIndexOf('px!=')
    if(index > 0 && (url[index - 1] == '&' || url[index - 1] == '?')) {
      var rawBaseUrl = pathquery.substring(index + 4);
      rawBaseUrl = decodeURIComponent(rawBaseUrl);
      var basePathQuery = pathquery.substring(0, index - 1);
      return [rawBaseUrl, basePathQuery, anchor];
    }
  }

  /**
   * url
   *    /asdfadadfaf
   *    https://....
   *
   */
  function decodeUrl(url, referer) {
    var full = parseUrl(url)
    if(full) url = full.pathquery + full.anchor;
    var parts = parseEncodedUrl(url)
    if(parts) {
      return parts[0] + parts[1] + parts[2];
    } else if (referer) {
      parts = parseEncodedUrl(referer);
      if(parts) {
        return parts[0] + (full ? (full.pathquery + full.anchor) :url);
      }
    }
    return null;
  }
  /* =========== decode request ==================== */

  /* ----------- decode cookie ---------------------*/

  /* ----------- end dcookie ------------------------*/


  // request
    function decodeRefererV1 (referer) {
      return referer.replace(HOST_PATTERN, function(full, scheme, domain, _, suffix) {
          return scheme + decodeHost(domain) + (suffix && decodePathAndQuery(suffix) || '');
      });
    }

    function decodeRequestHeadersV1 (headers) {
      var decodedHeader = {};
      for (var name in headers) {
        var value = headers[name];
        var lname = name.toLowerCase();
        if (lname === 'host') {
          continue;
        }else if (lname === 'referer' || lname === 'origin') {
          value = decodeRefererV1(value);
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

    function decodeRequestHeadersV2 (headers) {
      var decodedHeader = {};
      for (var name in headers) {
        var value = headers[name];
        var lname = name.toLowerCase();
        if (lname === 'host') {
          continue;
        }else if (lname === 'referer' || lname === 'origin') {
          value = decodeUrl(value);
        }
        //else if(lname === 'cookie') {
        //}
        else if (lname === 'accept-encoding') {
          if (options.compress === false)
            continue;
          // if (value.indexOf('gzip') >= 0)
          //   value = 'gzip';
        }
        decodedHeader[name] = value;
      }
      return decodedHeader;
    }

  var HOST_PATTERN_V1 = new RegExp(
    '^(https://|http://|)([\\w\\d\\-\\.]+)\\.' + //domain
    _pServerAndPort +  //server
    '(\\/https?)?(\\/.*)?', 'i'); //schemeFlag, path or not

  function decodeRequestV1(req) {
    var host = req.headers.host;
    var match = HOST_PATTERN.exec(host);
    if(!match) return;

    var options = {
      method: req.method
    , host: match[2]
    , headers: decodeRequestHeadersV1(req.headers)
    }
    var _url = req.url;
    var match = /\/(https?)(\d*)(.*)/i.exec(_url);
    if (match) {
      if (match[1] === 'https') {
        options.isSecure = true;
        options.port = match[2] || 443;
      }else {
        options.port = match[2] || 80;
      }
      options.path = match[3];
    }else {
      //TODO: use refererance scheme;
      options.port = 80;
      options.path = _url;
    }
    options.path = decodePathAndQuery(options.path);

  }

  function decodeRequestV2(req) {
    var rawUrl = decodeUrl(req.url, req.headers && req.headers.referer)
    console.log('rawUrl<%s>', rawUrl)
    if(!rawUrl) return;

    var parts = parseUrl(rawUrl);
    if(!parts) {
      throw new Error('rawUrl<%s> invalid', rawUrl)
    }
    console.log(parts)

    return {
      method: req.method
    , host: parts.domain
    , headers: decodeRequestHeadersV2(req.headers)
    , path: parts.pathquery + parts.anchor
    , isSecure: parts.scheme == 'https'
    , port: parts.port || parts.scheme == 'https' && 443 || 80
    }

  }

  function decodeRequest(req) {
    return decodeRequestV2(req) || decodeRequestV1(req)
  }
  /* =========== end decode request ================ */

  /* =========== encode response =================== */

  function encodeResponseHeaders (headers, reqOptions) {
      var encodedHeaders = {};
      for (var name in headers) {
        var lname = name.toLowerCase();
        var value = headers[name];
        if (lname === 'set-cookie') {
          value = encodeCookies(value);
        }else if (lname === 'location') {
          console.log('location:<%s>', value);
          value = encodeUrl(value, reqOptions);
          console.log('encoded location:<%s>', value);
        }else if (lname === 'status') {
          continue;
        }
        encodedHeaders[name] = value;
      }
      return encodedHeaders;
    }

    function encodeCookies (cookies) {
      var encodedCookies = [];
      for (var i = 0; i < cookies.length; i++) {
        var oneCookies = encodeCookie(cookies[i]);
        encodedCookies[encodedCookies.length] = oneCookies[0];
        if (oneCookies[1]) {
          encodedCookies[encodedCookies.length] = oneCookies[1];
        }
      }
      return encodedCookies;
    }

    function encodeCookie(cookie) {
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

      var encodedCookies;
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
        encodedCookies = [
          cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
              return prefix + encodeHost(domain) + '.' + options.server + suffix;
          })
        ];
        /*
        if (is_secure) {
          encodedCookies =
          [secure_replace_domain()];
        }else if (is_http) {
          encodedCookies =
          [normal_replace_domain()];
        }else {
          encodedCookies =
          [
            secure_replace_domain(),
            normal_replace_domain()
          ];
        }
        */
      }else {
        encodedCookies = [cookie];
      }

      return encodedCookies;
    }
  /* =========== end response ====================== */


  return {
    encodeUrl: encodeUrl
  , decodeUrl: decodeUrl
  , encodeCookie: null
  , decodeCookie: null

  , decodeRequest: decodeRequest
  , decodeRequestV1: decodeRequestV1
  , decodeRequestV2: decodeRequestV2

  , encodeResponseHeaders: encodeResponseHeaders
    //--------------
  , decodeHost: decodeHost
  , encodeHost: encodeHost
  , encodeScript: encodeScript
  , encodeBody: encodeBody
  , decodeQuery: decodeQuery
  , decodePathAndQuery: decodePathAndQuery
  };

};
