var zlib = require('zlib')
  , util = require('util');

exports.bodyEncoder  = function(creq, cres, sreq, sres, next, logger) {
  var encoder = sreq.encoder;

  var headers = encoder.encodeResponseHeaders(cres.headers, creq);

  var contentType = cres.headers['content-type'];
  var isText = contentType && /(text|javascript)/.test(contentType);
  var isScript = contentType && /javascript/.test(contentType) ||
                 (isText && ! /text\/(css|html)/.test(contentType)) ||
                 /\.js(\?|#|$)/.test(creq.path);
  isText = isText || isScript;
  logger.info('contentType:' + contentType + " isScript:"+isScript);
  var contentEncoding = cres.headers['content-encoding'];
  var contentLength = Number(cres.headers['content-length']);
  var charset = /charset=([\w\d\-]+)/.exec(contentType);
  charset = charset && charset[1] || 'utf8';
  var encoding;
  if ('ascii' === charset || 'utf8' === charset || 'utf-8' === charset) {
    encoding = charset;
  }else {
    encoding = 'binary';
  }

  delete headers['content-length'];
  sres.writeHead(
    cres.statusCode,
    headers
  );
  // if binary simply pipe cres
  if(!isText) {
    return cres.pipe(sres);
  }

  var zipStream;

  switch (contentEncoding) {
    // or, just use zlib.createUnzip() to handle both cases
    case 'gzip':
    cres = cres.pipe(zlib.createGunzip());
    zipStream = zlib.createGzip();
    break;
    case 'deflate':
    cres.pipe(zlib.createInflate());
    zipStream = zlib.createDeflate();
    break;
    default:
    if(contentEncoding)
      logger.error('unsupported content-encoding: <%s>', contentEncoding);
    break;
  }

  if(zipStream) {
    zipStream.pipe(sres);
    sres = zipStream;
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
      var body = buffer.toString(encoding);
      body = encoder.encodeBody(body, isScript);
      logger.debug('decodedHeaders:\n' + util.inspect(headers));
      try{
        // sres.write(body, encoding);
        // zipStream must write buffer
        sres.write(new Buffer(body, encoding));
      }catch(e){
        logger.error('error when write to response', e);
      }
      sres.end();
  });

}
