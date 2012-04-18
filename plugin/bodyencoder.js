exports.bodyEncoder  = function(creq, cres, sreq, sres, next, logger) {
  var encoder = sreq.encoder;
  var body = encoder.encodeBody(cres.body, cres.isScript, cres.isStyle);
  sres.write(new Buffer(body, 'binary'));
  sres.end();
}
