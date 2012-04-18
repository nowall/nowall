var exports = module.exports = function(req, res, sreq, sres, next){
  var cookies = res.headers['set-cookie'];
  var options = sreq.options;
  console.log('res.headers');
  console.log(res.headers)
  if(cookies) {
    res.headers['set-cookie'] = encodeCookies(cookies);
    console.log('encodedCookies');
    console.log(res.headers['set-cookies']);
  }
  next();

  function encodeCookies (cookies) {
    var encodedCookies = [];
    for (var i = 0; i < cookies.length; i++) {
      var oneCookies = encodeCookie(cookies[i]);
      encodedCookies[encodedCookies.length] = oneCookies[0];
      if (oneCookies[1]) {
        encodedCookies[encodedCookies.length] = oneCookies[1];
      }
    }
    return encodedCookies;
  }

  function encodeCookie(cookie) {
    var domain_pattern = /([;^]?\s*domain=)([^;]*)([;$]?)/i,
        secure_pattern = /([;^]?\s*)(secure)([;$]?)/i,
        httponly_pattern = /([;^]?\s*)(httponly)([;$]?)/i;

    var is_http = httponly_pattern.exec(cookie),
        is_secure = secure_pattern.exec(cookie),
        has_domain = domain_pattern.exec(cookie),
        domain = has_domain && has_domain[2];

    if (is_secure && !options.useHttps)
      cookie = cookie.replace(secure_pattern, '$1HttpOnly$3');

    if (is_http && options.useHttps)
      cookie = cookie.replace(httponly_pattern, '$1Secure$3');

    var encodedCookies;
    /*
     function secure_replace_domain() {
       return cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
           return prefix + encodeHost(domain) + '.s.' + options.server + suffix;
       });
     }

     function normal_replace_domain() {
       return cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
           return prefix + encodeHost(domain) + '.h.' + options.server + suffix;
       });
     }
     */
    if (domain) {
      console.log(domain);
      encodedCookies = [
        cookie.replace(domain_pattern, function(full, prefix, domain, suffix) {
            // FIXME use a jar
            return prefix + '.' + sreq.options.server + suffix;
        })
      ];
      /*
       if (is_secure) {
         encodedCookies =
         [secure_replace_domain()];
       }else if (is_http) {
         encodedCookies =
         [normal_replace_domain()];
       }else {
         encodedCookies =
         [
           secure_replace_domain(),
           normal_replace_domain()
         ];
       }
       */
    }else {
      encodedCookies = [cookie];
    }

    return encodedCookies;
  }
}
