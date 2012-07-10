var replaceGA = require('../lib/utils').replaceGA;

var exports = module.exports = function(req, res, sreq, sres, next, logger) {
  // replace ga code
  res.body = replaceGA(res.body, res.headers['content-type']);
  next();
}
