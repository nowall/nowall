var exports = module.exports = function(req, res, sreq, sres, next){
  if(req.host.indexOf('twitter.com') >=0) {
    res.body = res.body.replace(/document.domain\s*=\s*['"].*['"];?/ig, '');
  }
  else if(req.host.indexOf('akamaihd.net') >= 0) {
    // c/phoenix/en/bundle/t1-hogan-core.f760c184d1eaaf1cf27535473a7306ef.js
    //if(!d)throw new Error("The endpoint, "+this.methodName+" is not a registered API method");
    res.body = res.body.replace(
      'if(!d)throw new Error("The endpoint, "+this.methodName+" is not a registered API method");', 
      //  The endpoint, account/verify_credentials?px!=https://twimg0-a.akamaihd.net is not a registered API method
      'if(!d) {' +
      'if(d.match(/.*px!=.*/))' + 
      'd = d.replace(/.px!=.*$/, "");' +
      'else throw new Error("The endpoint, "+this.methodName+" is not a registered API method");' +
      '}')
  }
  next();
}
