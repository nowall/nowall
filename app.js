var express = require('express'),
    config = require('./config'),
    querystring = require('querystring'),
    db = require('./database'),
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
});

app.get('/', function(req, res) {
    res.redirect('/here');
});

app.get('/here', function(req, res) {
    res.render('index', {
        title: 'No WALL be here'
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

app.get('/signup', function(req, res) {
    var email = req.query.email,
        verify_code = req.query.verify_code;

    db.user.findOne({email: email, verify_code: verify_code}, function(err, result){
        if(!result){
          res.render('404',function(err,result){
              res.send(result, 404);
          });
        } else {
          res.render('signup', {
              user : result
          });
        }
    });
});

app.post('/signup', function(req, res) {
    var email = req.body.email,
        verify_code = req.body.verify_code;
    console.dir(req.body);

    db.user.update({email: email, verify_code: verify_code},
      {
        $set: {password: req.body.password},
        $unset: {verify_code: 1}
      },
      function(err, reply){
        console.dir(reply);
        if(err){
          res.render('500',function(err, result){
              res.send(result, 500)
          });
        } else {
          req.flash('info', '注册成功')
          res.redirect('/');
        }
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
