var ROOT_HOST_PATTERN_0 = /([^\w\d\-]|^)(([\d\w\-]+)\.(com|net|org|enu)(\.\w{2})?)([^\w\d\-]|$)/
var ROOT_HOST_PATTERN_1 = /([^\w\d\-]|^)([\d\w\-]+\.\w{2,4}(\.\w{2})?)([^\w\d\-]|$)/

var BASE_MAP = '0123456789abcdefghijklmnopqrstuvwxyz',
    ENCODE_MAP = 'abcdefghijklmnopqrstuvwxyz0123456789';

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

exports.encodeScript = function(body){
  return body.replace(ROOT_HOST_PATTERN_0, function(full, prefix, root, _, _, _, suffix){
      root = root.replace(/-/g,'--');
      root = root.replace(/\./g,'-');
      root = encode(root);
      return (prefix || '') + root + (suffix || '');
  });
}

