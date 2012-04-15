var template = require('../lib/template')
  , should = require('should')
  , fs = require('fs');

describe('Simple template', function() {
    it('should load from ./views', function(done) {
        template.load('flvplayer.html', function(err, data) {
            data.should.equal(fs.readFileSync(__dirname + '/../views/flvplayer.html', 'utf8'));
            done();
        })
    })

    it('should render template', function(done) {
        template.load('flvplayer.html', function(err, data) {
            template.render(data, {
                flvurl: 'test.flv'
            }).should.equal(fs.readFileSync(__dirname + '/flvplayer.out.html', 'utf8'));
            done();
        })
    })
})
