# Module dependencies.

express = require('express')
config = require('./config')
querystring = require('querystring')

app = module.exports = express.createServer()

# Configuration

app.configure () ->
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(require('stylus').middleware({ src: __dirname + '/public' }))
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))

app.configure 'development', () ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })) 

app.configure 'production', () ->
  app.use(express.errorHandler()) 

# Routes

app.get '/', (req, res) ->
  res.redirect '/here'

app.get '/here', (req, res) ->
  res.render('index', {
      title: 'Express',
  })

app.get '/search', (req, res) ->

  req.on 'end', () ->
    q = req.query.q.trim()
    m = q.match /^(https?:\/\/)?([\w\d][\.\w\d\-]+\.\w{2,4}\w{2}?\/?\S*)$/
    if m
      url = (m[1] or 'http://') + m[2]
    else
      url = 'http://www.google.com/search?sourceid=chrome&ie=UTF-8&' + querystring.stringify({q:q})

    res.redirect proxy.encodeLocation(url)

# Only listen on $ node app.js

if !module.parent
  app.listen(3000)
  console.log("Express server listening on port %d", app.address().port)
