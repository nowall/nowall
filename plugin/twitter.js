var exports = module.exports = function(req, res, sreq, sres, next){
  if(req.host.indexOf('twitter.com') >=0) {
    if(!req.isSecure) {
      res.body = '<script>location.href = "https://twitter.com"</script>'
      return next();
    }
    // &quot;url&quot;:&quot;http:\/\/t.co\/7zJEGfyo&quot;
    res.body = res.body.replace(/http:\\\/\\\/t.co\\\/[\w\d]+/ig, function(path) {
        return sreq.encoder.encodeUrl(path.replace(/\\\//g, '/')).replace(/\//g, '\\/');
    })

    res.body = res.body.replace(/document.domain\s*=\s*['"].*['"];?/ig, '');
    res.isScript = false;
  }
  else if(req.host.indexOf('akamaihd.net') >= 0) {
    // c/phoenix/en/bundle/t1-hogan-core.f760c184d1eaaf1cf27535473a7306ef.js
    // ,d=twttr.anywhere.api.endpoints[this.methodName];
    //if(!d)throw new Error("The endpoint, "+this.methodName+" is not a registered API method");
    res.body = res.body.replace(
      ',d=twttr.anywhere.api.endpoints[this.methodName];'
      // 'if(!d)throw new Error("The endpoint, "+this.methodName+" is not a registered API method");'
      //  The endpoint, account/verify_credentials?px!=https://twimg0-a.akamaihd.net is not a registered API method
    , ';if(this.methodName.match(/.*px!=.*/)) ' + 
      'this.methodName = this.methodName.replace(/.px!=.*$/, "");' +
      'var d=twttr.anywhere.api.endpoints[this.methodName];')
    res.isScript = false;
  }
  next();
}
