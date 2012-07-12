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
  body = body.replace(/(\s*google_ad_client\s*=\s*['"])(.+?)(['"]\s*)/, function(full, pre, id, suff){
      replace = true;
      return pre + 'ca-pub-5093888354340048' + suff;
  }).replace(/(\s*google_ad_slot\s*=\s*['"])(.+?)(['"]\s*)/, function(full, pre, id, suff){
      // replace = true;
      return pre + '2271512350' + suff;
  });

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
