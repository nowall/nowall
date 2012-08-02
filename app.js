var express = require('express'),
    config = require('./config'),
    querystring = require('querystring'),
    utils = require('./lib/utils'),
    app = module.exports = express.createServer();

var RedisStore = require('connect-redis')(express);
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "sexy girls", store: new RedisStore }));
    //app.use(require('nothing').middleware({ src: __dirname + '/public' }));
    app.use(require('stylus').middleware({
          src: __dirname + '/public'
    }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
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

app.dynamicHelpers({
    messages : require('express-messages')
});

app.helpers({
    config : config
  , dev : app.settings.env == 'development'
  , base_url: ''
  , scheme: 'http'
});

app.get('/', function(req, res) {
    res.redirect('/here');
    // res.redirect(config.httpsURL + '/here!/')
});

app.get('/here', function(req, res) {
    res.render('index', {
        title: 'No WALL be here'
      , version: 'v1'
    });
});

app.post('/donation/success', function(req, res) {
    res.render('donation_success', {
        title: 'Thank you',
        data: req.body
    });
});

app.post('/donation/cancel', function(req, res) {
    res.render('donation_cancel', {
        title: 'Thank you',
        data: req.body
    });
});

app.get('/search', function(req, res) {
        var m, q, url, _ref;
        q = req.query.q.trim();
        q = utils.decodeX(q);
        m = q.match(/^(https?:\/\/)?([\w\d][\.\w\d\-]+\.(\w{2,4})(\.\w{2})?\/?\S*)$/);
        if (m && (m[1] || ((_ref = m[3]) === 'com' || _ref === 'org' || _ref === 'edu' || _ref === 'net'))) {
          url = (m[1] || 'http://') + m[2];
        } else {
          url = 'http://www.google.com/search?sourceid=chrome&ie=UTF-8&' + querystring.stringify({
              q: q
          });
        }
        return res.redirect(global.proxy.encodeLocation(url));
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express server listening on port %d', app.address().port);
}
