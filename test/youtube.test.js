var should = require('should')
  , youtube = require('../plugin/youtube')
  , fs = require('fs')
  , template = require('../lib/template')
  ;

describe('Youtube plugin ', function(){
    it('should match request', function() {
        youtube.getVid({
            host: 'www.youtube.com'
          , path: '/watch?v=ABCdef0123'
        }).should.equal('ABCdef0123');
    })

    it('should replacePlayer', function(done) {
        fs.readFile(__dirname + '/watch_v=SAc0vQCC6UQ.html', 'utf8', function(err, body) {
            template.load('flvplayer.html', function(err, data) {
                youtube.replacePlayer(body, data).replace(/\s+/g, ' ')
                  .should.equal(fs.readFileSync(
                    __dirname + '/watch_v=SAc0vQCC6UQ.out.html', 'utf8')
                    .replace(/\s+/g, ' '));
                done();
            });
        })
    })
})
