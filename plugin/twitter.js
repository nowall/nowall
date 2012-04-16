var exports = module.exports = function(req, res, sreq, sres, next){
  if(req.host.indexOf('twitter.com') >=0) {
    res.body = res.body.replace("document.domain = 'twitter.com';", '');
  }
  next();
}
