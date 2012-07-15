var utils = require('../lib/utils')
  , encodeNW = utils.encodeNW
  , should = require('should')
  ;

describe('utils', function(){
    it('should encode', function(){
        encodeNW('facebook').should.equal('fasep00k')
        encodeNW('FACEBOOK').should.equal('FASEPOOK')
        encodeNW(encodeNW('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')).should.equal('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    })

    it('should encodeX', function(){
        utils.decodeX(utils.encodeX('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')).should.equal('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    })

    describe('fixurlv2', function(){

    it('should replace', function(){

        utils.fixurlv2('/roh-pdf-120712033122-phpapp02?px!=images.slidesharecdn.com.js?1342082037')
          // .should.equal('https://ssl.nowall.be/roh-pdf-120712033122-phpapp02.js?px!=images.slidesharecdn.com&1342082037')
          .should.equal('/roh-pdf-120712033122-phpapp02.js?1342082037&px!=images.slidesharecdn.com')
        utils.fixurlv2('/?px!=https:s-static.ak.facebook.comconnect/xd_arbiter.php?version=9#channel=f2c0522a4&origin=https%3A%2F%2Fssl.nowall.be&channel_path=%2F%3Fpx!%3Dpublic.slidesharecdn.comchannel.html%26fb_xd_fragment%23xd_sig%3Df12ae24d98%26')
          .should.equal('/connect/xd_arbiter.php?version=9#channel=f2c0522a4&origin=https%3A%2F%2Fssl.nowall.be&channel_path=%2F%3Fpx!%3Dpublic.slidesharecdn.comchannel.html%26fb_xd_fragment%23xd_sig%3Df12ae24d98%26&px!=https:s-static.ak.facebook.com')

        utils.fixurlv2('/finscn/https://ssl.nowall.be/in.js?px!=platform.linkedin.com').should.equal('/in.js?px!=platform.linkedin.com');
        utils.fixurlv2('/finscn/https://ssl.nowall.be/js/plusone.js?px!=apis.google.com').should.equal('/js/plusone.js?px!=apis.google.com');

        utils.fixurlv2('https://ssl.nowall.be/https://pagead2.googlesyndication.com/pagead/show_companion_ad.js').should.equal('/pagead/show_companion_ad.js?px!=pagead2.googlesyndication.com')
    })

    })

    describe('getOldHost', function(){
        var getOlderHost = utils.getOlderHost;
        var serverPort = 'nowall.be';
        // console.log(utils.encodeOld('com|net|org|edu|info|tv|us|tw|jp|ko|in'))
        getOlderHost('www.ozymr3swo2-myw-36.nowall.be', serverPort).should.equal('www.epochtimes.com.tw')
        getOlderHost('www.ozymr3swo2-myw.nowall.be', serverPort).should.equal('www.epochtimes.com')
        should.not.exist(getOlderHost('www.ozymr3swo2-s0m.nowall.be', serverPort))
    })
})
