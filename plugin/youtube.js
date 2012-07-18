var template = require('../lib/template');
var utils = require('../lib/utils');

var exports = module.exports = function(req, res, sreq, sres, next){
  var vid = exports.getVid(req);

  if(vid) {
    console.log('match youtube');

    template.load('flvplayer.html', function(err, data) {
        if(err) return next(err);
        console.log('loaded template');
        res.body = exports.replacePlayer(res.body, data, vid);
        next();
    })
  } else {
    next();
  }

}

exports.getVid = function(req) {
  // http://www.youtube.com/watch?v=SAc0vQCC6UQ
  if(req.host == 'www.youtube.com') {
    var match = req.path.match(/^\/watch\?v=([\w\d]+)/i);
    return match && match[1];
  }
}

// youtube key fregment
//
// <div id="watch-player" class="flash-player"></div>
// <script>
// </script>
exports.replacePlayer = function(body, player, vid) {
  return exports.replaceScript(body, function(full, script) {
      var flashvars = exports.stripFlashvars(script);
      if(!flashvars) return full;
      console.log(flashvars);
      flashvars.flvurl = flashvars.url_encoded_fmt_stream_map.url;
      // flashvars.flvurl = 'https://ssl.nowall.be' + utils.encodeSymboUrl(flashvars.flvurl);
      flashvars.vid = vid;
      flashvars.thumbnail = 'https://i3.ytimg.com/vi/' + vid + '/default.jpg';
      return template.render(player, flashvars);
  });
};

exports.replaceScript = function(body, replacer) {
  return body.replace(/<div id="watch-player" class="flash-player"><\/div>[\s\S]*?<script\s?[^>]*>([\s\S]*?)<\/script>/, replacer);
}

// most important
// flashvars = {
//    url_encoded_fmt_stream_map : {
//        url: 
//        quality: 'small',
//        fallback_host: 'tc.v12.cache2.c.youtube.com',
//        type: 'video/x-flv',
//        itag: '5'
// keywords: 'Ryan+Dahl,Node.js,Node,Javascript,Server+Side,Development',
// watermark: ',http://s.ytimg.com/yt/img/watermark/youtube_watermark-vflHX6b6E.png,http://s.ytimg.com/yt/img/watermark/youtube_hd_watermark-vflAzLcD6.png'
// video_id: 'SAc0vQCC6UQ'
//
exports.stripFlashvars = function(script) {
  var parts = script.split(/\s+/);
  for(var i = 0; i<parts.length; i++) {
    var part = parts[i];
    var m = part.match(/flashvars=\\?"(.*)\\?"/);
    if(m) {
      var code = m[1];
      var flashvars = decodeUrlStr(code, '\\u0026amp;', '=');
      flashvars.url_encoded_fmt_stream_map = decodeUrlStr(flashvars.url_encoded_fmt_stream_map, '&', '=');
      flashvars.rvs = decodeUrlStr(flashvars.rvs, '&', '=');
      return flashvars;
    }
  }
}

function decodeUrlStr(str, sep, eq) {
  var pairs = str.split(sep);
  if(pairs.length == 1) return str;
  var obj = {};
  for(var j = 0; j < pairs.length; j ++ ) {
    var pair = pairs[j].split(eq);
    obj[pair[0]] = decodeURIComponent(pair[1]);
  }
  return obj;
}
