var NW_BASE_MAP = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    NW_ENCODE_MAP = 'apstef9hijk1mn0bqrcduvw6yzAPSTEFGHIJKNMLOBQRCDUVWXYZol2345x78g',
    X_ENCODE_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

exports.replaceEncode = function(str, base_map, encode_map) {
    var result = '';
    for (var i = 0, len = str.length; i < len; i++) {
      var index = base_map.indexOf(str[i]);
      if (index >= 0) {
        result += encode_map[index];
      }else {
        result += str[i];
      }
    }
    return result;
  }

exports.encodeNW = function(str) {
  return exports.replaceEncode(str, NW_BASE_MAP, NW_ENCODE_MAP)
}

exports.encodeX = function(str) {
  return exports.replaceEncode(str, NW_BASE_MAP, X_ENCODE_MAP)
}

exports.decodeX = function(str) {
  return exports.replaceEncode(str, X_ENCODE_MAP, NW_BASE_MAP)
}

exports.startWith = function(str, start) {
  return str && (str.substr(0, start.length) == start);
}

exports.endWith = function(str, end) {
  return str && (str.substr(- end.length) == end);
}

exports.fixurlv2 = function(url, serverPort) {
    if(url.indexOf('px!=' < 0) && url.match(/\/search?.*q=.*/)) {
      // 'https://ssl.nowall.be/search?hl=zh-CN&site=&source=hp&q=test&btnK=Google+%E6%90%9C%E7%B4%A2&px!=https:www.google.com'
      // fix google search
      url = url + '&px!=https:www.google.com'
    } else {
      // slideshare fix
      // https://ssl.nowall.be/roh-pdf-120712033122-phpapp02?px!=images.slidesharecdn.com.js?1342082037
      // url = url.replace(/(.*)\?px!=([^\?&]+)\.(js|css|xml|json)[\?|&]?(.*)/i, '$1.$3?px!=$2&$4')
      // facebook links
      // https://ssl.nowall.be/?px!=https:s-static.ak.facebook.comconnect/xd_arbiter.php?version=9#channel=f2c0522a4&origin=https%3A%2F%2Fssl.nowall.be&channel_path=%2F%3Fpx!%3Dpublic.slidesharecdn.comchannel.html%26fb_xd_fragment%23xd_sig%3Df12ae24d98%26
      url = url.replace(/(.*)\?px!=(.*?\.(?:com|net|org))(.*)\?(.*)/, '$1$3?$4&px!=$2')

      // linkedin link
      // https://ssl.nowall.be/finscn/https://ssl.nowall.be/in.js?px!=platform.linkedin.com
      // google api link
      // https://ssl.nowall.be/finscn/https://ssl.nowall.be/js/plusone.js?px!=apis.google.com
      url = url.replace(/(?:\/[^\?&]*)?\/https:\/\/(?:.*?)(\/.*)/, '$1')
    }
    return url;
}

exports.replaceBody = function(body, contentType) {
  body = exports.replaceGA(body, contentType);
  body = exports.replaceGAD(body, contentType);
  return body;
}

exports.replaceGA = function (body, contentType) {
  var replace = false;
  body = body.replace(/(\[\s*['"]_setAccount['"]\s*,\s*['"])(.+?)(['"]\s*\])/, function(full, pre, id, suff){
      replace = true;
      return pre + 'UA-22925186-1' + suff;
  });
  if(!replace && contentType == 'text/html') {
    body = body.replace(/<\/head>/, 
"<script>var _gaq = _gaq || []; _gaq.push(['_setAccount', 'UA-22925186-1']); _gaq.push(['_trackPageview']); (function() { var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true; ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s); })(); </script></head>");
  }

  return body
}

exports.replaceGAD = function (body, contentType) {
  var replace = false;
  body = body.replace(/(\s*google_ad_client\s*=\s*['"])(.+?)(['"]\s*)/g, function(full, pre, id, suff){
      replace = true;
      return pre + 'ca-pub-5093888354340048' + suff;
  }).replace(/(\s*google_ad_slot\s*=\s*['"])(.+?)(['"]\s*)/g, function(full, pre, id, suff){
      // replace = true;
      return pre + '2271512350' + suff;
  }).replace(/http:\/\/pagead2.googlesyndication.com\//g, 'https://pagead2.googlesyndication.com/');

  if(!replace && contentType == 'text/html') {
    // TODO add popup advertisting

    // add GA code
    // res.body = res.body.replace(/<\/head>/, 
// "<script>var _gaq = _gaq || []; _gaq.push(['_setAccount', 'UA-22925186-1']); _gaq.push(['_trackPageview']); (function() { var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true; ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s); })(); </script></head>");

  }
  return body;
}

// <script type="text/javascript"><!--
// google_ad_client = "ca-pub-5093888354340048";
// /* nowall-replaced */
// google_ad_slot = "2271512350";
// google_ad_width = 728;
// google_ad_height = 90;
// //-->
// </script>
// <script type="text/javascript"
// src="http://pagead2.googlesyndication.com/pagead/show_ads.js">
// </script>

