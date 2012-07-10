var exports = module.exports = function(req, res, sreq, sres, next, logger) {
  // replace gad code
  var replaced = false;
  // res.body = res.body.replace(/(\s*google_ad_client\s*=\s*['"])(.+?)(['"]\s*)/, function(full, pre, id, suff){
  //     console.log('id' + id)
  //     replace = true;
  //     return pre + 'ca-pub-5093888354340048' + suff;
  // }).replace(/(\s*google_ad_slot\s*=\s*['"])(.+?)(['"]\s*)/, function(full, pre, id, suff){
  //     // replace = true;
  //     return pre + '2271512350' + suff;
  // });
  if(!replaced && res.headers['content-type'] == 'text/html') {
    // TODO add popup advertisting

    // add GA code
    // res.body = res.body.replace(/<\/head>/, 
// "<script>var _gaq = _gaq || []; _gaq.push(['_setAccount', 'UA-22925186-1']); _gaq.push(['_trackPageview']); (function() { var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true; ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s); })(); </script></head>");
  }
  next();
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
