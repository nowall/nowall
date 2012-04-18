var zlib = require('zlib')
  , util = require('util');

module.exports = function(creq, cres, sreq, sres, next, logger) {
  if(sres.isText) {
    delete headers['content-length'];
  }
  sres.writeHead(
    cres.statusCode,
    cres.headers
  );
  // if binary simply pipe cres
  if(!cres.isText) {
    return cres.pipe(sres);
  }

  var zipStream;
  var headers = cres.headers;

  var contentEncoding = cres.headers['content-encoding'];

  switch (contentEncoding) {
    // or, just use zlib.createUnzip() to handle both cases
    case 'gzip':
    cres = this.cres = cres.pipe(zlib.createGunzip());
    zipStream = zlib.createGzip();
    break;
    case 'deflate':
    cres = this.cres = cres.pipe(zlib.createInflate());
    zipStream = zlib.createDeflate();
    break;
    default:
    if(contentEncoding)
      logger.error('unsupported content-encoding: <%s>', contentEncoding);
    break;
  }

  if(zipStream) {
    cres.headers = headers;
    zipStream.pipe(sres);
    sres = this.sres = zipStream;
  }

  var bufferLenght, buffers, body;
  buffers = [];
  bufferLenght = 0;
  body = '';

  cres.on('error', function(err) {
      logger.error(err);
      sres.end();
  });

  cres.on('data', function(chunk) {
      buffers.push(chunk);
      bufferLenght += chunk.length;
  });

  cres.on('end', function() {
      var buffer = new Buffer(bufferLenght);
      for (var i = 0, offset = 0; i < buffers.length; i++) {
        buffers[i].copy(buffer, offset);
        offset += buffers[i].length;
      }

      // var contentLength = Number(cres.headers['content-length']);
      var contentType = cres.headers['content-type'];
      var charset = /charset=([\w\d\-]+)/.exec(contentType);
      charset = charset && charset[1] || 'utf8';
      var encoding;
      if ('ascii' === charset || 'utf8' === charset || 'utf-8' === charset) {
        encoding = charset;
      }else {
        encoding = 'binary';
      }

      cres.body = buffer.toString(encoding);

      return next();
  });

}
