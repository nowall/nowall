var whitelist = exports.whitelist = [
  // [domain, supportHTTPS]
  ["github.com", 1]
, ["google-analytics.com", 1]
, ["googlesyndication.com", 1]
, ["doubleclick.net", 1 ]
, ["slidesharecdn.com", 1]
  // , "images.slidesharecdn.com"
  // , "public.slidesharecdn.com"
, ["linkedin.com", 1]
, ["apis.google.com", 1]
, ["cn", 0]
, ["weibo.com", 0]
];

exports.updateDomain =function(domain, url) {
  // var dns = require('dns');
  // // http://ip-to-country.webhosting.info/book/print/5
  // dns.resolve4(domain, function(err, addresses) {
  //     // check ip, add to redis
  // });
  // call api from SAE. check ip from china
  // auto update PAC file
}

exports.loadWhiteList = function() {
  // redisClient.get
}
