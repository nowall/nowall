var should = require('should') 
  , options = {serverAndPort:'posts.li'}
  , encode = require('../lib/encode')(options);

describe('Encrypt Url', function(){


    describe('bigfile', function(){

    });

    describe('encodeHost', function(){
        it('should not equal host', function(){

            function testHost(host) {
              encode.encodeHost(host).should.not.equal(host);
              encode.decodeHost(encode.encodeHost(host)).should.equal(host);
            }
            testHost('twitter.com');
            testHost('http://www.twitter.com');
            testHost('http://images.facebook.com/asdfa');
            testHost('http://groups.google.com/asdfa');
            testHost('http://groups.goo-gle.com/asdfa');
            testHost('http://groups.google.com.hk/asdfa');
            testHost('http://groups.goo-gle.com.hk/asdfa');
        })
    });

    describe('encodeScript', function(){
        function testScript(script) {
          encode.encodeScript(script).should.not.equal(script);
          // TODO ...
          // console.log(encode.encodeScript(script));
        }

        it('should not equal encodedScript', function(){
        testScript('domain.xx="twitter.com";')
        testScript('domain.xx="www.google.com.hk";')
        testScript('domain.xx="www.goo-gle.com.hk";')
        testScript('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) ');
        })
    });

    describe('encodeBody', function(){
        function testBody(body) {
          encode.encodeBody(body, false).should.not.equal(body);
          // TODO
          // console.log(encode.encodeBody(body, false));
        }

        testBody('<script>var x="douban.com";</script><a href="http://www.douban.com">www.douban.com</a><cite>www.douban.com/<b>test</b>/</cite><script type="text/javascript">var x="douban.com";\nl"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", \nhostname.match(/(^(www|api)\\.)?twitter\\.com$/)</script>', false)
        testBody('<link type="text/css" rel="stylesheet" href="http://static.ak.fbcdn.net/rsrc.php/v1/y2/r/8Sr4ddHR5zZ.css" />');

    });

    describe('decodeQuery', function(){
        var decodedQuery = encode.decodeQuery('pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')

        var decodedPathAndQuery = encode.decodePathAndQuery('/account/auth/?pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')
    });

})
