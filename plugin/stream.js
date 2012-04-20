var zlib = require('zlib')
  , util = require('util');

module.exports = function(creq, cres, sreq, sres, next, logger) {
  var useRaw = !cres.isText || sreq.url.indexOf('pxraw=true') > 0 || cres.isScript;
  if(!useRaw) {
    delete cres.headers['content-length'];
  }
  console.log('writing headers')
  console.log(cres.headers)
  sres.writeHead(
    cres.statusCode,
    cres.headers
  );
  // if binary simply pipe cres
  if(useRaw) {
    return cres.pipe(sres);
  }

  var zipStream;
  var cresStream = cres;

  var contentEncoding = cres.headers['content-encoding'];

  switch (contentEncoding) {
    // or, just use zlib.createUnzip() to handle both cases
    case 'gzip':
    cresStream = cres.pipe(zlib.createGunzip());
    zipStream = zlib.createGzip();
    break;
    case 'deflate':
    cresStream = cres.pipe(zlib.createInflate());
    zipStream = zlib.createDeflate();
    break;
    default:
    if(contentEncoding)
      logger.error('unsupported content-encoding: <%s>', contentEncoding);
    break;
  }

  if(zipStream) {
    zipStream.pipe(sres);
    sres = this.sres = zipStream;
  }

  var bufferLenght, buffers, body;
  buffers = [];
  bufferLenght = 0;
  body = '';

  cresStream.on('error', function(err) {
      logger.error(err);
      sres.end();
  });

  cresStream.on('data', function(chunk) {
      buffers.push(chunk);
      bufferLenght += chunk.length;
  });

  cresStream.on('end', function() {
      var buffer = new Buffer(bufferLenght);
      for (var i = 0, offset = 0; i < buffers.length; i++) {
        buffers[i].copy(buffer, offset);
        offset += buffers[i].length;
      }

      // var contentLength = Number(cres.headers['content-length']);
      // var contentType = cres.headers['content-type'];
      // console.log(contentType);
      // var charset = /charset=([\w\d\-]+)/.exec(contentType);
      // charset = charset && charset[1] || 'ascii';
      // var encoding;
      // if ('ascii' === charset || 'utf8' === charset || 'utf-8' === charset) {
      //   encoding = charset;
      // }else {
      //   encoding = 'binary';
      // }

      cres.body = buffer.toString('binary');

      return next();
  });

}
