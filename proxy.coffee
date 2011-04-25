require.paths.unshift __dirname + "/support/"
connect = require 'connect'
config = require './config'
config.useHttps = config.useHttps && true
config.port = config.port || if config.useHttps then 443 else 80


proxy = global.proxy = require('myproxy')({
  server: config.server
  port: config.port
  useHttps: config.useHttps
  compress: config.compress || false
  logger: config.logger
})

module.exports = connect (req, res) ->
  try
    proxy(req, res)
  catch e
    logger.error 'error to handle proxy of ' + req.headers.host + req.url, e
