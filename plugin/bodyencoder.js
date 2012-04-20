exports.bodyEncoder  = function(creq, cres, sreq, sres, next, logger) {
  var encoder = sreq.encoder;
  // TODO allow options to load script but not encode script
  var body = encoder.encodeBody(cres.body, cres.isScript, cres.isStyle);
  sres.write(new Buffer(body, 'binary'));
  sres.end();
}
