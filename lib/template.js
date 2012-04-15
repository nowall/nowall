var resolve = require('path').resolve
  , fs = require('fs');

// simple template
exports.render = function (html, ctx) {
  for(var name in ctx) {
    var re = new RegExp('{' + name + '}', 'g');
    html = html.replace(re, ctx[name]);
  }
  return html;
}

var cache=[];
exports.load = function (path, callback) {
  path = resolve(__dirname + '/../views/', path);
  var tmpl = cache[path];
  if(tmpl) return callback(null, tmpl);
  fs.readFile(path, 'utf8', function(err, data) {
      if(err) return callback(err);
      cache[path] = data;
      callback(null, data);
  });
}

