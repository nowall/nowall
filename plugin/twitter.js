var exports = module.exports = function(req, res, sreq, sres, next){
  if(req.host == 'twitter.com') {
    res.body = res.body.replace("document.domain = 'twitter.com';", '');
  }
  next();
}
