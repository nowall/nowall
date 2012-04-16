var should = require('should') 
  , options = {
      baseURL:'https://nowall.be'
    , serverAndPort: 'nowall.be'
    , whiteList: ['github.com', 'plusone.google.com'] // test hostname only, not url
    , debug: false
    , reqOptions: {
        host: 'test.com'
      , port: 443
      , isSecure: true
      }
    }
  , e = encodeURIComponent
  , encode = require('../lib/encodev2')(options);

describe('encodev2', function(){

    describe('encodeUrl', function(){

        it('should ?px!', function(){
            encode.encodeUrl('http://www.twitter.com').should.equal(
              'https://nowall.be/?px!=http://www.twitter.com');
            encode.encodeUrl('://www.twitter.com').should.equal(
              'https://nowall.be/?px!=http://www.twitter.com');
        })

        it('should encode relative path', function(){
            encode.encodeUrl('/login').should.equal('/login?px!=https://test.com');
        })

        it('should encode host', function(){
            // complex query
            encode.encodeUrl('http://groups.google.com/?p1=v1&p2=v2').should.equal('https://nowall.be/?p1=v1&p2=v2&px!=http://groups.google.com');

            encode.encodeUrl('http://hello.foo-bar.com.hk/path/to/path?p1=v1&p2=v2')
              .should.equal('https://nowall.be/path/to/path?p1=v1&p2=v2&px!=http://hello.foo-bar.com.hk');

            // anchor
            encode.encodeUrl('http://test.com/?p1=v1&p2=v2#anchor')
              .should.equal('https://nowall.be/?p1=v1&p2=v2&px!=http://test.com#anchor');

            // path
            encode.encodeUrl('http://test.com/foo/bar.jpg#anchor')
              .should.equal('https://nowall.be/foo/bar.jpg?px!=http://test.com#anchor');
            // whiteList
            encode.encodeUrl('http://github.com').should.equal('http://github.com');
            encode.encodeUrl('http://guileen.github.com').should.equal('http://guileen.github.com');
        })

        it('should no more path', function(){
            // FIXME https://ssl.nowall.be:3333/gb/images/b_8d5afc09.png?px!=http://ssl.gstatic.com/gb/images/b_8d5afc09.png
        })

        it('should not encode data:', function(){
            encode.encodeUrl('data:image/jpeg;base64blabla').should.equal('data:image/jpeg;base64blabla')
        })

        it('should not unlimited parse', function(){
            encode.encodeUrl('https://nowall.be/test').should.equal('https://nowall.be/test');
        })
    });

    describe('decodeUrl', function() {
        it('should match ?px!', function() {
            encode.decodeUrl('/?px!=http://twitter.com')
              .should.equal('http://twitter.com/');
        });

        it('should match &px!', function(){
            encode.decodeUrl('/p/to/p?p1=v1&px!=https://twitter.com#anchor')
              .should.equal('https://twitter.com/p/to/p?p1=v1#anchor');
        });

        it('should match referer', function() {
            encode.decodeUrl('/foo?p1=v1#foo', 'https://nowall.be/?px!=https://t.cn#anchor')
              .should.equal('https://t.cn/foo?p1=v1#foo');
            should.not.exist(encode.decodeUrl('/abcde?q=v#anchor'));
        });

        it('should parse root url', function() {
            encode.decodeUrl('https://ssl.nowall.be/?px!=http://test.com')
              .should.equal('http://test.com/');
        })

        it('should parse full url', function() {
            encode.decodeUrl('https://nowall.be/foo?p1=v1&px!=http://t.cn#anchor')
              .should.equal('http://t.cn/foo?p1=v1#anchor');
        })
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

        it('should handle href link', function() {
            encode.encodeBody('<p><a href="../login">test</a><a href="http://www.test.com/test">full</a>')
              .should.equal('<p><a href="../login?px!=https://test.com">test</a><a href="https://nowall.be/test?px!=http://www.test.com">full</a>');

        });

        it('should handle none scheme', function() {
            var encodedBody = encode.encodeBody('blabla<script id="www-core-js" src="://s.ytimg.com/yt/jsbin/www-core-vflb497eV.js"></script>blabla');
            encodedBody.should.equal('blabla<script id="www-core-js" src="https://nowall.be/yt/jsbin/www-core-vflb497eV.js?px!=http://s.ytimg.com"></script>blabla')
        })

        it('should on correct postion', function() {
            encode.encodeBody('<script>{swfobject.embedSWF("https://nowall.be/swf/player.swf", "player_normal", "400", "300", "9.0.45", "", flashvars, params, attributes)\n;})();\n//]]\n</script>', false)
              .should.equal('<script>{swfobject.embedSWF("https://nowall.be/swf/player.swf", "player_normal", "400", "300", "9.0.45", "", flashvars, params, attributes)\n;})();\n//]]\n</script>', false);
        })
        it('should script', function(){
            var encodedBody = encode.encodeBody('<script>var x="douban.com";</script><a href="http://www.douban.com">www.douban.com</a><cite>www.douban.com/<b>test</b>/</cite><script type="text/javascript">var x="douban.com";\nl"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", \nhostname.match(/(^(www|api)\\.)?twitter\\.com$/)</script>', false)
            encodedBody.should.equal('<script>var x="douban.com";</script><a href="https://nowall.be/?px!=http://www.douban.com">www.douban.com</a><cite>www.douban.com/<b>test</b>/</cite><script type="text/javascript">var x="douban.com";\nl"api":"https:\\/\\/nowall.be\\/a\\/1302888170\\/javascripts\\/api.bundle.js?px!=http:\\/\\/a2.twimg.com", \nhostname.match(/(^(www|api)\\.)?twitter\\.com$/)</script>')
        })

        it('should css', function() {
            var encodedBody = encode.encodeBody('<link type="text/css" rel="stylesheet" href="http://static.ak.fbcdn.net/rsrc.php/v1/y2/r/8Sr4ddHR5zZ.css" />', false);
            encodedBody.should.equal('<link type="text/css" rel="stylesheet" href="https://nowall.be/rsrc.php/v1/y2/r/8Sr4ddHR5zZ.css?px!=http://static.ak.fbcdn.net" />')
        })

        it('should youtube', function() {
            var script = ' var swf = "  s\\u0072c=\\"https:\\/\\/s.ytimg.com\\/yt\\/swfbin\\/watch_as3-vflF75dGN.swf\\"   ;ad3_module=https%3A%2F%2Fs.ytimg.com%2Fyt%2Fswfbin%2Fad3-vflr05jiO.swf\\u0026amp;enablecsi=1\\u0026amp;iv3_module=https%3A%2F%2Fs.ytimg.com%2Fyt%2Fswfbin%2Fiv3_module-vflfak9F6.swf\\u0026amp;gut_tag=%2F4061%2Fytpwmpu%2Fmain_471\\u0026amp"';
            encode.encodeBody(script, true).should.equal(' var swf = "  s\\u0072c=\\"https:\\/\\/nowall.be\\/yt\\/swfbin\\/watch_as3-vflF75dGN.swf?px!=https:\\/\\/s.ytimg.com\\"   ;ad3_module=https%3A%2F%2Fnowall.be%2Fyt%2Fswfbin%2Fad3-vflr05jiO.swf%3Fpx!%3Dhttps%3A%2F%2Fs.ytimg.com\\u0026amp;enablecsi=1\\u0026amp;iv3_module=https%3A%2F%2Fnowall.be%2Fyt%2Fswfbin%2Fiv3_module-vflfak9F6.swf%3Fpx!%3Dhttps%3A%2F%2Fs.ytimg.com\\u0026amp;gut_tag=%2F4061%2Fytpwmpu%2Fmain_471\\u0026amp"');

            script = ' var swf = "  flashvars=\\"url=http%3A%2F%2Fo-o.preferred.nuq04s10.v5.lscache4.c.youtube.com%2Fvideoplayback%3Fupn%3Ds0XIsevkJTA%26sparams&quality=medium';
            encode.encodeBody(script, true).should.equal(' var swf = "  flashvars=\\"url=https%3A%2F%2Fnowall.be%2Fvideoplayback%3Fupn%3Ds0XIsevkJTA%26sparams%26px!%3Dhttp%3A%2F%2Fo-o.preferred.nuq04s10.v5.lscache4.c.youtube.com&quality=medium');

            script = 'this.lf&&Rh(Se("https://plusone.google.com/_/+1/confirm",{url:a.url,source:"google:youtube"}),{width:480,height:550}))};'
            encode.encodeBody(script, true).should.equal(script);

            script = '{Kg("https://apis.google.com/js/plusone.js",s(this.Pj,this))};';
            encode.encodeBody(script, true).should.equal('{Kg("https://nowall.be/js/plusone.js?px!=https://apis.google.com",s(this.Pj,this))};');

            script = 'url_encoded_fmt_stream_map=url%3Dhttp%253A%252F%252Fo-o.preferred.nuq04s10.v5.lscache4.c.youtube.com%252Fvideoplayback%253Fupn%253D6i66J8nCUTc%2526sparams%253Dalgorithm%25252Cburst%25252Ccp%25252Cfactor%25252Cid%25252Cip%25252Cipbits%25252Citag%25252Csource%25252Cupn%25252Cexpire%2526fexp%253D917000%25252C909703%25252C901802%25252C913101%25252C914102%2526algorithm%253Dthrottle-factor%2526itag%253D34%2526ip%253D50.0.0.0%2526burst%253D40%2526sver%253D3%2526signature%253D09FE3AC7146A5BCBAE0BDB7E19DD180B2971BF73.D93D68919C846A83A10971479CD039D204F6406F%2526source%253Dyoutube%2526expire%253D1334476230%2526key%253Dyt1%2526ipbits%253D8%2526factor%253D1.25%2526cp%253DU0hSSVRSVF9ISkNOMl9MTFhDOlV5MDVlQnY3b2c4%2526id%253D480734bd0082e944%26quality%3Dmedium%26fallback_host%';
            encode.encodeBody(script, true).should.equal('url_encoded_fmt_stream_map=url%3Dhttps%253A%252F%252Fnowall.be%252Fvideoplayback%253Fupn%253D6i66J8nCUTc%2526sparams%253Dalgorithm%25252Cburst%25252Ccp%25252Cfactor%25252Cid%25252Cip%25252Cipbits%25252Citag%25252Csource%25252Cupn%25252Cexpire%2526fexp%253D917000%25252C909703%25252C901802%25252C913101%25252C914102%2526algorithm%253Dthrottle-factor%2526itag%253D34%2526ip%253D50.0.0.0%2526burst%253D40%2526sver%253D3%2526signature%253D09FE3AC7146A5BCBAE0BDB7E19DD180B2971BF73.D93D68919C846A83A10971479CD039D204F6406F%2526source%253Dyoutube%2526expire%253D1334476230%2526key%253Dyt1%2526ipbits%253D8%2526factor%253D1.25%2526cp%253DU0hSSVRSVF9ISkNOMl9MTFhDOlV5MDVlQnY3b2c4%2526id%253D480734bd0082e944%2526px!%253Dhttp%253A%252F%252Fo-o.preferred.nuq04s10.v5.lscache4.c.youtube.com%26quality%3Dmedium%26fallback_host%')
        })
    });

    describe('decodeQuery', function(){
        var decodedQuery = encode.decodeQuery('pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')

        var decodedPathAndQuery = encode.decodePathAndQuery('/account/auth/?pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts=')
    });

    describe('decodeRequestV2', function() {

        var options = {
              baseURL:'https://nowall.be'
            , serverAndPort: 'nowall.be'
            , whiteList: ['github.com', 'plusone.google.com'] // test hostname only, not url
            , debug: true
            , reqOptions: {
                host: 'test.com'
              , port: 443
              , isSecure: true
              }
            }
        var encode = require('../lib/encodev2')(options);
        it('should return null', function(){
            should.not.exist(encode.decodeRequestV2({
                  url: '/here'
                , headers: {
                    referer: '/'
                  }
            }));
        });

        it('should return https://t.com', function() {
            var opt = encode.decodeRequestV2({
                url: '/p/2/p?px!=https://t.com'
            });
            opt.host.should.equal('t.com');
            opt.isSecure.should.be.true;
            opt.path.should.equal('/p/2/p');

        });

        it('should use referer', function() {
            var opt = encode.decodeRequestV2({
                url: '/path?query#anchor'
              , headers: {
                  referer: 'https://nowall.be/refpath?px!=http://t.com#anchor'
                }
            })
            opt.host.should.equal('t.com');
            opt.isSecure.should.be.false;
            opt.headers.referer.should.equal('http://t.com/refpath#anchor')
            opt.path.should.equal('/path?query#anchor');
        })
    })

    describe('encodeResponseV2', function() {
        it('should not unlimited redirect', function() {
            var res = encode.encodeResponseHeaders({
                location: 'http://google.com/search?q=test'
            });
            res.location.should.equal('https://nowall.be/search?q=test&px!=http://google.com')
        })

        it('should parse relative redirection', function() {
            var res = encode.encodeResponseHeaders({
                location: '/j?k='
              });
            res.location.should.equal('/j?k=&px!=https://test.com')
        });
    })

})
