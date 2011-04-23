require.paths.unshift __dirname + "/support/"
connect = require 'connect'
config = require './config'
config.useHttps = config.useHttps && true
config.port = config.port || if config.useHttps then 443 else 80

log4js = require('log4js')()
log4js.addAppender(log4js.fileAppender(config.logfile))

proxy = global.proxy = require('myproxy')({
  server: config.server
  port: config.port
  useHttps: config.useHttps
  compress: config.compress || false
  logger: log4js
})

module.exports = connect (req, res) ->
  try
    proxy(req, res)
  catch e
    logger.error 'error to handle proxy of ' + req.headers.host + req.url, e
