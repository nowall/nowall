var zlib = require('zlib')
  , util = require('util');

exports.bodyEncoder  = function(creq, cres, sreq, sres, next, logger) {
  var encoder = sreq.encoder;
  var body = encoder.encodeBody(cres.body, cres.isScript);
  sres.write(new Buffer(body, cres.encoding));
  sres.end();
}
