var should = require('should') 
  , options = {
      baseURL:'https://nowall.be'
    , serverAndPort: 'nowall.be'
    , whiteList: ['github.com'] // test hostname only, not url
    }
  , e = encodeURIComponent
  , encode = require('../lib/encode')(options);

describe('encode', function(){

    describe('encodeUrl', function(){

        it('should ?px!', function(){
            encode.encodeUrl('http://www.twitter.com').should.equal(
              'https://nowall.be/?px!=' + e('http://www.twitter.com'));
        })

        it('should not equal host', function(){
            // complex query
            encode.encodeUrl('http://groups.google.com/?p1=v1&p2=v2').should.equal('https://nowall.be/?p1=v1&p2=v2&px!=' + e('http://groups.google.com'));

            encode.encodeUrl('http://hello.foo-bar.com.hk/path/to/path?p1=v1&p2=v2')
              .should.equal('https://nowall.be/path/to/path?p1=v1&p2=v2&px!=' + e('http://hello.foo-bar.com.hk'));

            // anchor
            encode.encodeUrl('http://test.com/?p1=v1&p2=v2#anchor')
              .should.equal('https://nowall.be/?p1=v1&p2=v2&px!=' 
                + e('http://test.com') + '#anchor');

            // path
            encode.encodeUrl('http://test.com/foo/bar.jpg#anchor')
              .should.equal('https://nowall.be/foo/bar.jpg?px!=' 
                + e('http://test.com') + '#anchor');
            // whiteList
            encode.encodeUrl('http://github.com').should.equal('http://github.com');
            encode.encodeUrl('http://guileen.github.com').should.equal('http://guileen.github.com');
        })
    });

    describe('decodeUrl', function() {
        it('should match ?px!', function() {
            encode.decodeUrl('/?px!=' + e('http://twitter.com'))
              .should.equal('http://twitter.com/');
        });

        it('should match &px!', function(){
            encode.decodeUrl('/p/to/p?p1=v1&px!=' + e('https://twitter.com') + '#anchor')
              .should.equal('https://twitter.com/p/to/p?p1=v1#anchor');
        });

        it('should match referer', function() {
            encode.decodeUrl('/foo?p1=v1#foo', 'https://nowall.be/?px!=' + e('https://t.cn') + '#anchor')
              .should.equal('https://t.cn/foo?p1=v1#foo');
            should.not.exist(encode.decodeUrl('/abcde?q=v#anchor'));
        });
    });

    describe('encodeScript', function(){
        it('should not equal encodedScript', function(){
            console.log(encode.encodeScript('domain.xx="twitter.com";'))
            console.log(encode.encodeScript('domain.xx="www.google.com.hk";'))
            console.log(encode.encodeScript('domain.xx="www.goo-gle.com.hk";'))
            console.log(encode.encodeScript('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) '))
        })
    });

    describe('encodeBody', function(){
        it('should script', function(){
            var encodedBody = encode.encodeBody('<script>var x="douban.com";</script><a href="http://www.douban.com">www.douban.com</a><cite>www.douban.com/<b>test</b>/</cite><script type="text/javascript">var x="douban.com";\nl"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", \nhostname.match(/(^(www|api)\\.)?twitter\\.com$/)</script>', false, true)
            encodedBody.should.equal('<script>var x="douban.com";</script><a href="https://nowall.be/?px!=http%3A%2F%2Fwww.douban.com">www.douban.com</a><cite>www.douban.com/<b>test</b>/</cite><script type="text/javascript">var x="douban.com";\nl"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", \nhostname.match(/(^(www|api)\\.)?twitter\\.com$/)</script>')
        })

        it('should css', function() {
            var encodedBody = encode.encodeBody('<link type="text/css" rel="stylesheet" href="http://static.ak.fbcdn.net/rsrc.php/v1/y2/r/8Sr4ddHR5zZ.css" />', false, true);
            encodedBody.should.equal('<link type="text/css" rel="stylesheet" href="https://nowall.be/rsrc.php/v1/y2/r/8Sr4ddHR5zZ.css?px!=http%3A%2F%2Fstatic.ak.fbcdn.net" />')
        })
    });

    describe('decodeQuery', function(){
        var decodedQuery = encode.decodeQuery('pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')

        var decodedPathAndQuery = encode.decodePathAndQuery('/account/auth/?pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')
    });

})
