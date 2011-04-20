var ROOT_HOST_PATTERN_0 = /([^\w\d\-]|^)(([\d\w\-]+)(\\?\.)(com|net|org|enu)(\.\w{2})?)([^\w\d\-]|$)/ig
var ROOT_HOST_PATTERN_1 = /([^\w\d\-]|^)([\d\w\-]+\.\w{2,4}(\.\w{2})?)([^\w\d\-]|$)/

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

var DOMAIN_ATTR_PATTERN = /(document.domain\s*=\s*['"])([\w\d\-\.]+)(['"])/ig

//prefix, scheme, domain, path, suffix
var CSS_URL_PATTERN =
/(\(\s*['"]?\s*)(http|https|):?\/\/([\w\d\.\-\\]+\.\w{2,4})(\/[^\)]*?)(\s*['\"]?\s*\))/ig;

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

exports.encodeHost = function(host){
  return host.replace(ROOT_HOST_PATTERN_1, function(full, prefix, root, _, suffix){
      root = root.replace(/-/g,'--');
      root = root.replace(/\./g,'-');
      root = encode(root);
      return (prefix || '') + root + (suffix || '');
  });
}

exports.decodeHost = function(host){
  parts = host.split('.');
  root = parts.pop();
  root = root.replace(/--/g,'**');
  root = root.replace(/-/g, '.');
  root = root.replace(/\*\*/g,'-');
  if(parts.length == 0)
    return decode(root);
  return parts.join('.') + '.' + decode(root);
}

exports.encodeScript = function(body, options){
  return body.replace(ROOT_HOST_PATTERN_0, function(full, prefix, root, _, sep, _, _, suffix){
      root = root.replace(/-/g,'--');
      root = root.replace(/\./g,'-');
      root = encode(root);
      return (prefix || '') + root + sep + options.serverAndPort + (suffix || '');
  });
}

exports.encodeBody = function(data, options, isScript, debug) {
  var that = this;
  var data = data.replace(SRC_URL_PATTERN,
    function(full, attr_prefix, attr, attr_suffix,
      url_prefix, scheme, domain, path, url_suffix) {

      var result = attr_prefix + attr + attr_suffix + url_prefix +
                   (options.useHttps ? 'https://' : 'http://') +
                   exports.encodeHost(domain) + '.' + options.serverAndPort +
                   (scheme === 'https' ? '/https' : '/http') +
                   path + url_suffix;
      if(debug){
        console.log('==========SRC match<' + full + '>=============');
        console.log('==========result is<' + result + '>=============');
      }
      return result;
  });
  data = data.replace(CSS_URL_PATTERN,
    function(full, prefix, scheme, domain, path, suffix) {
      var result = prefix +
                   (options.useHttps ? 'https://' : 'http://') +
                   exports.encodeHost(domain) + '.' + options.serverAndPort +
                   (scheme === 'https' ? '/https' : '/http') +
                   path + suffix;
      if(debug){
        console.log('==========CSS match<' + full + '>=============');
        console.log('==========result is<' + result + '>=============');
      }
      return result;
  });

  data = data.replace(DOMAIN_ATTR_PATTERN, function(full, prefix, domain, suffix) {
      var result = prefix + exports.encodeHost(domain) + '.' + options.server + suffix;
      if(debug){
        console.log('=======DOMAIN match<' + full + '>=============');
        console.log('==========result is<' + result + '>=============');
      }
      return result;
  });

  // TODO: avoid replace twice or trible.

  //if(isScript)
  data = exports.encodeScript(data, options);

  return data;
}
