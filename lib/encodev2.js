var querystring = require('querystring');

/**
 * v1 : http://qqq-www-zye.nowall.be
 * v2 : https://nowall.be/?px!=www.t.cn
 * options
 *    baseURL
 *    cookiejar
 *
 */
module.exports = function(options) {

  var reqOptions = options.reqOptions;
  var debug = options.debug;
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
    "(\\s|\\.|\\,|'|\"|\\{)" + // attr_pref
    "(src|href|action|embed|"/*url|*/ + "server)(['\"]?\\s*[=" + /*:*/ "]\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    // "(http|https|):?//([^/'\"]+)" + //scheme, domain
    // "(/?[^'\"]*)" + // path
    "([^'\"\\s\\(\\);]*)" + // fullpath
    "('|\"|&#39;|&apos;|&quot;)", //path, url_suffix
    'ig'
  );

  var DOMAIN_ATTR_PATTERN = /(document.domain\s*=\s*['"])([\w\d\-\.]+)(['"])/ig;

  //prefix, scheme, domain, path, suffix
  var CSS_URL_PATTERN =
  /(\(\s*['"]?\s*)(http|https|):?\/\/([\w\d\.\-\\]+\.\w{2,4})(\/[^\)'\"\n\r]*?)(\s*['\"]?\s*\))/ig;
  // *?  is special dont change to * , not sure

  // TODO 使用更精确的正则 [\\\|\+\-\?\/=\.,_&%@#:!\w\d]
  // to match          var a = 'http:\/\/test.com\/foo\/bar\/'
  var SCRIPT_BACKSLASH_URL_PATTERN = /(http|https|):?\\?\/\\?\/([\w\d\.\-\\]+\.\w{2,4})(\\?\/[^'\";,\*\r\n\)\(\s]*?)(\\?['\"$;,])/ig;

  var SCRIPT_URL_PATTERN = new RegExp(
    "(\\s|\\.|\\,|'|\"|\\{)\\s*" + // attr_pref
    "(src|href|action|embed|"/*url|*/ + "server)(['\"]?\\s*[=:]\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    // "(http|https|):?//([^/'\"]+)" + //scheme, domain
    // "(/?[^'\"]*)" + // path
    "([^'\"\\s\\(\\);]*)" + // fullpath
    "('|\"|&#39;|&apos;|&quot;)", //path, url_suffix
    'ig'
  );
  // FIXME url decode query is required
  // to match          var a = 'http:\/\/test.com\/foo\/bar\/'
  // most for youtube
  var SCRIPT_URLENCODED_URL_PATTERN = /(http|https|)%3A%2F%2F([\w\d\.\-\\]+\.\w{2,4})(%2F[^'\";,]*?)(['\"$;,&=]|\\u0026amp;)/ig;
  // maybe only for youtube
  var SCRIPT_URLENCODED_TWICE_URL_PATTERN = /(http|https|)%253A%252F%252F([\w\d\.\-\\]+\.\w{2,4})(%252F[^'\";,]*?)(['\"$;,&=]|\\u0026amp;|%3D|%26)/ig;

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
    // backslash script pattern
    body = body.replace(SCRIPT_BACKSLASH_URL_PATTERN,
      function(full, scheme, domain, path, suffix) {
        if(debug) {
          console.log('=====backslash script match<%s> =========', full)
        }
        var isBackSlash = full.indexOf('\\/\\/') >= 0;
        if(isBackSlash) {
          path = path.replace(/\\\//g, '/');
        }
        var url = encodeUrl((scheme || 'http') + '://' + domain + path);
        if(isBackSlash) url = url.replace(/\//g, "\\/");
        var result = url + suffix;
        if (debug) {
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    body = body.replace(SCRIPT_URL_PATTERN,
      function(full, attr_prefix, attr, attr_suffix,
        url_prefix, /*scheme, domain, */path, url_suffix) {

        var result = attr_prefix + attr + attr_suffix + url_prefix +
                     /* -- attr_value -- */
                     encodeUrl(/* scheme + '://' + domain + */ path) +
                     // (options.useHttps ? 'https://' : 'http://') +
                     // encodeHost(domain) + '.' + options.serverAndPort +
                     // (scheme === 'https' ? '/https' : '/http') +
                     url_suffix;
        if (debug) {
          console.log('==========SCRIPT_URL match<%s> path:<%s>=============', full, path);
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });
    body = body.replace(SCRIPT_URLENCODED_URL_PATTERN,
      function(full, scheme, domain, path, suffix) {
        if(debug) {
          console.log('=====urlencoded script script match<%s> =========', full)
        }
        path = decodeURIComponent(path);
        var url = encodeUrl((scheme || 'http') + '://' + domain + path);
        url = encodeURIComponent(url);
        var result = url + suffix;
        if (debug) {
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    body = body.replace(SCRIPT_URLENCODED_TWICE_URL_PATTERN,
      function(full, scheme, domain, path, suffix) {
        if(debug) {
          console.log('=====urlencoded twice script match<%s> =========', full)
        }
        path = decodeURIComponent(decodeURIComponent(path));
        var url = encodeUrl((scheme || 'http') + '://' + domain + path);
        url = encodeURIComponent(encodeURIComponent(url));
        var result = url + suffix;
        if (debug) {
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    return body;
    // return body.replace(ROOT_HOST_PATTERN_0, function(full, prefix, root, _, sep, _, _, suffix) {
    //     root = root.replace(/-/g, '--');
    //     root = root.replace(/\./g, '-');
    //     root = encode(root);
    //     return (prefix || '') + root + sep + options.serverAndPort + (suffix || '');
    // });
  }
  // ------------------------ end v1 ----------------------

  var encodeBody = function(data, isScript) {
    if (isScript) return encodeScript(data, options);
    var that = this;
    var data = data.replace(SRC_URL_PATTERN,
      function(full, attr_prefix, attr, attr_suffix,
        url_prefix, /*scheme, domain, */path, url_suffix) {

        var result = attr_prefix + attr + attr_suffix + url_prefix +
                     /* -- attr_value -- */
                     encodeUrl(/* scheme + '://' + domain + */ path) +
                     // (options.useHttps ? 'https://' : 'http://') +
                     // encodeHost(domain) + '.' + options.serverAndPort +
                     // (scheme === 'https' ? '/https' : '/http') +
                     url_suffix;
        if (debug) {
          console.log('==========SRC match<%s> path:<%s>=============', full, path);
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

    // ([\s\S]*?) non-greedy dotall search
    data = data.replace(/(<script\s?[^>]*>)([\s\S]*?)(<\/script>)/g,
      function(full, prefix, script, suffix) {
        if (debug) {
          console.log('======Script match<' + script + '>=======');
        }
        return prefix + encodeScript(script) + suffix;
      }
    );

    return data;
  }

  // var decodeQuery = function(query) {
  //   if (!query) return '';
  //   query = querystring.parse(query);
  //   for (var name in query) {
  //     query[name] = query[name].replace(HOST_PATTERN,
  //       function(full, scheme, domain, _, suffix) {
  //         return scheme + decodeHost(domain) + (suffix || '');
  //     });
  //   }
  //   return querystring.stringify(query);
  // }

  // var decodePathAndQuery = function(path) {
  //   return path.replace(/([^\?]*)((\?)([^\?]*))?/, function(full, path, _, sep, query) {
  //       return (path || '') + (sep || '') + decodeQuery(query);
  //   });
  // }


  // =================== encode v2 =============

  var baseURL = options.baseURL;
  var whiteList = options.whiteList;
  var _pBaseURL = baseURL.replace(/\./g, '\\.');

  /**
   * very simple url parser
   */
  function parseUrl (url) {
    //       ht[1] ://   t.cn:80[3]   :port[4] /path[5]   ?query[6] #anchor[7]
    var m = /^(\w*):?\/\/(([^\/\?#:]+)(:\d+)?)(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url);
    if(!m) return null;
    var ret = {
      scheme : m[1] || 'http'
    , domain : m[3]
    , port: m[4] && parseInt(m[4].substring(1))
    , path : m[5] || '/'
    , query : m[6] || ''
    , anchor : m[7] || ''
    };
    ret.root = ret.scheme + '://' + m[2];
    ret.pathquery = ret.path + ret.query;
    return ret;

  }

  /**
   * full url
   *
   */
  function encodeFullUrl(url) {
    if(url.indexOf('px!=') > 0) return url;
    var parts = parseUrl(url);
    if(!parts) return url;

    for(var i in whiteList) {
      var w = whiteList[i];
      var domain = parts.domain;
      if(domain.indexOf('nowall.be') >= 0 || domain == w) return url;
      var lastIndex = domain.lastIndexOf(w);
      if(lastIndex >= 0 && lastIndex == (domain.length - w.length))
        return url;
    }
    return baseURL + parts.pathquery
      + (parts.query ? '&' : '?')
      + 'px!=' + parts.root
      + parts.anchor;
  }

  /**
   * very simple url parser
   */
  function parseRelativeUrl (url) {
    //        path[1]   ?query[2] #anchor[3]
    var m = /([^\?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url);
    if(!m) return null;
    var ret = {
      path : m[1] || ''
    , query : m[2] || ''
    , anchor : m[3] || ''
    };
    ret.pathquery = ret.path + ret.query;
    return ret;

  }
  /**
   * /path?query#anchor
   *
   */
  function encodeUrlPath(url) {
    if(!url)return url;
    if(url[0] == '#') return url;
    if(url.indexOf('data:') == 0) return url;
    if(url.indexOf('px!=') > 0) return url;

    var parts = parseRelativeUrl(url);
    if(!parts) return url;

    var scheme = reqOptions.isSecure ? 'https' : 'http';
    var port = (reqOptions.isSecure && reqOptions.port == 443 || reqOptions.port == 80 ) ? '' : ':' + reqOptions.port;
    var root = scheme + '://' + reqOptions.host + port

    return parts.pathquery
      + (parts.query ? '&' : '?')
      + 'px!=' + root
      + parts.anchor;
  }

  function encodeUrl(url) {
    return (/^(https?)?:\/\//.test(url)) ? encodeFullUrl(url) : encodeUrlPath(url);
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
      var pxParam = pathquery.substring(index + 4);
      var rawBaseUrl = pxParam = decodeURIComponent(pxParam);
      var basePathQuery = pathquery.substring(0, index - 1);

      index = pxParam.indexOf('&');
      if(index > 0) {
        rawBaseUrl = pxParam.substring(0, index)
        var exQuery = pxParam.substring(index + 1);
        basePathQuery = basePathQuery + (basePathQuery.indexOf('?') >= 0 ? '&' : '?') + exQuery;
      }

      return [rawBaseUrl, basePathQuery, anchor];
    }
  }

  /**
   * url
   *    /asdfadadfaf?px!=
   *    https://....?px!=
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
    if(!rawUrl) return;

    var parts = parseUrl(rawUrl);
    if(!parts) {
      throw new Error('rawUrl<%s> invalid', rawUrl)
    }

    if(parts.query) {
      parts.query = parts.query.split('&').map(function(param){
          var pair = param.split('=');
          var value = decodeURIComponent(pair[1]);
          if(value.indexOf('px!=') >= 0) {
              return pair[0] + '=' + encodeURIComponent(decodeUrl(value))
          }
          return param;
      }).join('&');
    }

    reqOptions = {
      method: req.method
    , host: parts.domain
    , headers: decodeRequestHeadersV2(req.headers)
    , path: parts.path + parts.query + parts.anchor
    , isSecure: parts.scheme == 'https'
    , port: parts.port || parts.scheme == 'https' && 443 || 80
    }

    return reqOptions;

  }

  function decodeRequest(req) {
    return decodeRequestV2(req) || decodeRequestV1(req)
  }
  /* =========== end decode request ================ */

  /* =========== encode response =================== */

  function encodeResponseHeaders (headers) {
      var encodedHeaders = {};
      for (var name in headers) {
        var lname = name.toLowerCase();
        var value = headers[name];
        if (lname === 'set-cookie') {
          value = encodeCookies(value);
        }else if (lname === 'location') {
          value = encodeUrl(value);
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
              // FIXME use a jar
              if(reqOptions.host.indexOf('twitter.com')) {
                return prefix + '.' + options.server + suffix;
              }
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
  // , decodeQuery: decodeQuery
  // , decodePathAndQuery: decodePathAndQuery
  };

};
