var replaceGAD = require('../lib/utils').replaceGAD;

var exports = module.exports = function(req, res, sreq, sres, next, logger) {
  // replace gad code
  res.body = replaceGAD(res.body, res.headers['content-type']);
  next();
}
