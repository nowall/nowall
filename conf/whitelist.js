var whitelist = exports.whitelist = [
  "github.com"
, "google-analytics.com"
, "googlesyndication.com"
, "doubleclick.net"
, "slidesharecdn.com"
, "linkedin.com"
, "apis.google.com"
, "cn"
, "weibo.com"
]

var dns = require('dns');

exports.inWhiteList =function(domain) {
  for(var i = 0; i < whiteList.length; i ++ ) {
      var w = whiteList[i];
      var domain = parts.domain;
      if(domain.lastIndexOf(w) == domain.length - w.length)
        return true;
  }

  // http://ip-to-country.webhosting.info/book/print/5
  dns.resolve4(domain, function(err, addresses) {

  });
}
