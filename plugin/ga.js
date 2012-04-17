var exports = module.exports = function(req, res, sreq, sres, next, logger) {
  // replace ga code
  var replaced = false;
  res.body = res.body.replace(/(\[\s*['"]_setAccount['"]\s*,\s*['"])(.+?)(['"]\s*\])/, function(full, pre, id, suff){
      replace = true;
      return pre + 'UA-22925186-1' + suff;
  });
  if(!replace && res.headers['content-type'] == 'text/html') {
    res.body = res.body.replace(/<\/head>/, 
"<script>var _gaq = _gaq || []; _gaq.push(['_setAccount', 'UA-22925186-1']); _gaq.push(['_trackPageview']); (function() { var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true; ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s); })(); </script></head>");
  }
  next();
}
