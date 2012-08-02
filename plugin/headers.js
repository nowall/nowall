var utils = require('../lib/utils');

var exports = module.exports = function(creq, cres, sreq, sres, next, logger) {

  var encoder = sreq.encoder;

  var headers = encoder.encodeResponseHeaders(cres.headers, creq);

  var contentType = cres.headers['content-type'];
  var isText = utils.isText(contentType) && contentType != 'text/plain';
  var isScript = contentType && /javascript/.test(contentType) ||
                 (isText && ! /text\/(css|html)/.test(contentType)) ||
                 /\.js(\?|#|$)/.test(creq.path);
  var isStyle = contentType == 'text/css';

  isText = isText || isScript;
  logger.info('contentType:' + contentType + " isScript:" + isScript);

  cres.headers = headers;
  cres.isScript = isScript;
  cres.isStyle = isStyle;
  cres.isText = isText;
  next();
}
