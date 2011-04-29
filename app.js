var express = require('express'),
    config = require('./config'),
    querystring = require('querystring'),
    app = module.exports = express.createServer();

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(require('nothing').middleware({ src: __dirname + '/public' }));
    app.use(require('stylus').middleware({
          src: __dirname + '/public'
    }));
    app.use(app.router);
    return app.use(express.static(__dirname + '/public'));
});
app.configure('development', function() {
    return app.use(express.errorHandler({
          dumpExceptions: true,
          showStack: true
    }));
});
app.configure('production', function() {
    return app.use(express.errorHandler());
});
app.get('/', function(req, res) {
    return res.redirect('/here');
});
app.get('/here', function(req, res) {
    return res.render('index', {
        title: 'No WALL be here'
    });
});
app.all('/donation/success', function(req, res) {
    console.dir(req);
    return res.render('donation_success', {
        title: 'Thank you'
    });
});
app.all('/donation/cancel', function(req, res) {
    return res.render('donation_cancel', {
        title: 'Thank you'
    });
});
app.get('/search', function(req, res) {
    return req.on('end', function() {
        var m, q, url, _ref;
        q = req.query.q.trim();
        m = q.match(/^(https?:\/\/)?([\w\d][\.\w\d\-]+\.(\w{2,4})(\.\w{2})?\/?\S*)$/);
        if (m && (m[1] || ((_ref = m[3]) === 'com' || _ref === 'org' || _ref === 'edu' || _ref === 'net'))) {
          url = (m[1] || 'http://') + m[2];
        } else {
          url = 'http://www.google.com/search?sourceid=chrome&ie=UTF-8&' + querystring.stringify({
              q: q
          });
        }
        return res.redirect(proxy.encodeLocation(url));
    });
});
if (!module.parent) {
  app.listen(3000);
  console.log('Express server listening on port %d', app.address().port);
}
