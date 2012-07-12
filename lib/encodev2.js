ONE_DAY = 24 * 60 * 60 * 1000;

(function(){
if(typeof window != 'undefined') {
  window.encoderv2 = encoder;
}

if(typeof module != 'undefined') {
// var querystring = require('querystring');
  module.exports = encoder;
}

/**
 * v1 : http://qqq-www-zye.nowall.be
 * v2 : https://nowall.be/?px!=www.t.cn
 * options
 *    baseURL
 *    cookiejar
 *
 */
function encoder(options) {

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
    "(src|href|action|embed|url|server)(['\"]?\\s*=\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    // "(http|https|):?//([^/'\"]+)" + //scheme, domain
    // "(/?[^'\"]*)" + // path
    "([^'\"\\s\\(\\);]*)" + // fullpath
    "('|\"|&#39;|&apos;|&quot;)", //path, url_suffix
    'ig'
  );

  //prefix, scheme, domain, path, suffix
  var CSS_URL_PATTERN =
  /(\(\s*['"]?\s*)((http|https|):?\/\/[\w\d\.\-\\]+\.\w{2,4}\/[^\)'\"\n\r]*?)(\s*['\"]?\s*\))/ig;
  var ALL_CSS_URL_PATTERN = 
  /([^\w\d]url\(\s*['"]?)([^\)]+)(['"]?\s*\))/ig;
  // *?  is special dont change to * , not sure

  // TODO 使用更精确的正则 [\\\|\+\-\?\/=\.,_&%@#:!\w\d]
  // to match          var a = 'http:\/\/test.com\/foo\/bar\/'
  var SCRIPT_BACKSLASH_URL_PATTERN = /("|')(http|https|):?\\?\/\\?\/([\w\d\.\-\\]+\.\w{2,4})(\\?\/[^'\";,\*\r\n\)\(\s]*?)(\\?['\"])/ig;

  var SCRIPT_URL_PATTERN = new RegExp(
    "(\\s|\\.|\\,|'|\"|\\{)\\s*" + // attr_pref
    // twitter url is keyword
    "(src|href|action|embed|" + /* url| */  "server)(['\"]?\\s*[=:]\\s*)" + //attr, attr_suff
    "('|\"|&#39;|&apos;|&quot;)" + //url_prefix
    // "(http|https|):?//([^/'\"]+)" + //scheme, domain
    // "(/?[^'\"]*)" + // path
    "([^'\"\\s\\(\\)\\[\\]\\{\\};,]*)" + // fullpath
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

  // var encodeHost = function(host) {
  //   return host.replace(ROOT_HOST_PATTERN_1, function(full, prefix, root, _, suffix) {
  //       root = root.replace(/-/g, '--');
  //       root = root.replace(/\./g, '-');
  //       root = encode(root);
  //       return (prefix || '') + root + (suffix || '');
  //   });
  // }

  // var decodeHost = function(host) {
  //   parts = host.split('.');
  //   root = parts.pop();
  //   root = root.replace(/--/g, '**');
  //   root = root.replace(/-/g, '.');
  //   root = root.replace(/\*\*/g, '-');
  //   if (parts.length == 0)
  //     return decode(root);
  //   return parts.join('.') + '.' + decode(root);
  // }

  // ------------------------ end v1 ----------------------
  var encodeScript = function(body) {
    // backslash script pattern
    body = body.replace(SCRIPT_BACKSLASH_URL_PATTERN,
      function(full, prefix, scheme, domain, path, suffix) {
        if(debug) {
          console.log('=====backslash script match<%s> =========', full)
        }
        var isBackSlash = full.indexOf('\\/\\/') >= 0;
        if(isBackSlash) {
          path = path.replace(/\\\//g, '/');
        }
        var url = encodeUrl((scheme || 'http') + '://' + domain + path);
        if(isBackSlash) url = url.replace(/\//g, "\\/");
        var result = prefix + url + suffix;
        if (debug) {
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    body = body.replace(SCRIPT_URL_PATTERN,
      function(full, attr_prefix, attr, attr_suffix,
        url_prefix, /*scheme, domain, */path, url_suffix) {
        var isBackSlash = full.indexOf('\\/\\/') >= 0;
        if(isBackSlash) {
          path = path.replace(/\\\//g, '/');
        }
        var url = encodeUrl(/* scheme + '://' + domain + */ path);
        if(isBackSlash) url = url.replace(/\//g, "\\/");
        var result = attr_prefix + attr + attr_suffix + url_prefix +
                     url + url_suffix;
        if (debug) {
          console.log('==========SCRIPT_URL match<%s> path:<%s>=============', full, path);
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });

    // body = body.replace(SCRIPT_URLENCODED_URL_PATTERN,
    //   function(full, scheme, domain, path, suffix) {
    //     if(debug) {
    //       console.log('=====urlencoded script script match<%s> =========', full)
    //     }
    //     path = decodeURIComponent(path);
    //     var url = encodeUrl((scheme || 'http') + '://' + domain + path);
    //     url = encodeURIComponent(url);
    //     var result = url + suffix;
    //     if (debug) {
    //       console.log('==========result is<' + result + '>=============');
    //     }
    //     return result;
    // });

    // body = body.replace(SCRIPT_URLENCODED_TWICE_URL_PATTERN,
    //   function(full, scheme, domain, path, suffix) {
    //     if(debug) {
    //       console.log('=====urlencoded twice script match<%s> =========', full)
    //     }
    //     path = decodeURIComponent(decodeURIComponent(path));
    //     var url = encodeUrl((scheme || 'http') + '://' + domain + path);
    //     url = encodeURIComponent(encodeURIComponent(url));
    //     var result = url + suffix;
    //     if (debug) {
    //       console.log('==========result is<' + result + '>=============');
    //     }
    //     return result;
    // });

    return body;
    // return body.replace(ROOT_HOST_PATTERN_0, function(full, prefix, root, _, sep, _, _, suffix) {
    //     root = root.replace(/-/g, '--');
    //     root = root.replace(/\./g, '-');
    //     root = encode(root);
    //     return (prefix || '') + root + sep + options.serverAndPort + (suffix || '');
    // });
  }

  function encodeStyle(body) {
    return body.replace(ALL_CSS_URL_PATTERN,
      function(full, prefix, path, suffix) {
        var url = encodeUrl(path);
        var result = prefix + url + suffix;
        if (debug) {
          console.log('==========CSS match<%s> path:<%s> suffix<%s>=============', full, path, suffix);
          console.log(url);
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });
  }

  var encodeBody = function(data, isScript, isStyle) {
    if (isScript) return encodeScript(data);
    if (isStyle) return encodeStyle(data);
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
          console.log('==========SRC match<%s> path:<%s>, suffix:<%s>=============', full, path, url_suffix);
          console.log('==========result is<' + result + '>=============');
        }
        return result;
    });
    data = data.replace(CSS_URL_PATTERN,
      function(full, prefix, path, _, suffix) {
        var url = encodeUrl(path);
        var result = prefix + url + suffix;
        if (debug) {
          console.log('==========CSS match<%s> path:<%s> suffix<%s>=============', full, path, suffix);
          console.log(url);
          console.log('==========result is<' + result + '>=============');
        }
        return result;
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
    var root = parts.root.replace('http://', '').replace('https://', 'https:');
    return baseURL + parts.pathquery
      + (parts.query ? '&' : '?')
      + 'px!=' + root
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

    var scheme = reqOptions.isSecure ? 'https:' : '';
    var port = (reqOptions.isSecure && reqOptions.port == 443 || reqOptions.port == 80 ) ? '' : ':' + reqOptions.port;
    var root = scheme + reqOptions.host + port

    return parts.pathquery
      + (parts.query ? '&' : '?')
      + 'px!=' + root
      + parts.anchor;
  }

  function encodeUrl(url) {
    return (/^((https?)?:)?\/\//.test(url)) ? encodeFullUrl(url) : encodeUrlPath(url);
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
        // px!=t.com&
        var exQuery = pxParam.substring(index + 1);
        basePathQuery = basePathQuery + (basePathQuery.indexOf('?') >= 0 ? '&' : '?') + exQuery;
      }

      // px!=t.com/bundle.js
      var match = rawBaseUrl.match(/(((https?):)?([^\/]*))(\/.*)?/);
      if(match) {
        rawBaseUrl = (match[3] || 'http') + '://' + match[4];
        basePathQuery = basePathQuery + (match[5] || '');
      }

      return [rawBaseUrl, basePathQuery.replace('//', '/'), anchor];
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
    // function decodeRefererV1 (referer) {
    //   return referer.replace(HOST_PATTERN, function(full, scheme, domain, _, suffix) {
    //       return scheme + decodeHost(domain) + (suffix && decodePathAndQuery(suffix) || '');
    //   });
    // }

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
    var rawUrl = decodeUrl(req.url || '/', req.headers && req.headers.referer)
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
    return decodeRequestV2(req); // || decodeRequestV1(req)
  }
  /* =========== end decode request ================ */

  /* =========== encode response =================== */

  function encodeResponseHeaders (headers) {
      var encodedHeaders = {};
      for (var name in headers) {
        var lname = name.toLowerCase();
        var value = headers[name];
        if (lname === 'location') {
          value = encodeUrl(value);
        } else if (lname === 'set-cookie') {
          value = encodeCookie(value);
        }else if (lname === 'status') {
          continue;
        }
        encodedHeaders[name] = value;
      }
      return encodedHeaders;
    }

    function encodeCookie (cookie) {
      // set expire time prevent cookie become too large
      console.log(cookie);
      date = new Date(Date.now() + ONE_DAY)
      return cookie.replace(/expires=.*?(;|$)/i, 'expires=' + date.toGMTString());
    }
  /* =========== end response ====================== */


  return {
    encodeUrl: encodeUrl
  , decodeUrl: decodeUrl
  , encodeCookie: encodeCookie
  , decodeCookie: null

  , decodeRequest: decodeRequest
  , decodeRequestV1: decodeRequestV1
  , decodeRequestV2: decodeRequestV2

  , encodeResponseHeaders: encodeResponseHeaders
    //--------------
  // , decodeHost: decodeHost
  // , encodeHost: encodeHost
  , encodeScript: encodeScript
  , encodeStyle: encodeStyle
  , encodeBody: encodeBody
  // , decodeQuery: decodeQuery
  // , decodePathAndQuery: decodePathAndQuery
  };

};

})();
