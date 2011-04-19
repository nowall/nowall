require.paths.unshift __dirname + "/support/"
multi_node = require 'multi-node'
http = require 'http'
https = require 'https'
fs = require 'fs'
config = require './config'
log4js = require('log4js')()
log4js.addAppender(log4js.fileAppender(config.logfile))

config.useHttps = config.useHttps && true
config.port = config.port || if config.useHttps then 443 else 80

proxy = require('myproxy')({
  server: config.proxyBaseDomain
  port: config.port
  useHttps: config.useHttps
  compress: config.compress || false
  logger: log4js
})

options = 
  key: fs.readFileSync __dirname + "/cert/server.key"
  cert: fs.readFileSync __dirname + "/cert/server.crt"

logger = log4js.getLogger('server')

handle = (req, res) ->
  try
    proxy(req, res)
  catch e
    logger.error 'error to handle proxy of ' + req.headers.host + req.url, e

if config.useHttps
  proxy_server = https.createServer options, handle
else
  proxy_server = http.createServer handle

http_server = http.createServer (req, res) ->
  if req.url is '/'
    return res.end "
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
  </head>
  <body>
  为保证安全，本站使用https协议，但是证书未授权，浏览器出现警告请不要惊慌。
  <a href='https://#{req.headers.host}#{req.url}'>点此进入</a>
  </body>
</html>"

  console.log "https://#{req.headers.host}#{req.url}"
  res.writeHead 302,
    Location: "https://#{req.headers.host}#{req.url}"
  res.end()

multi_node.listen {
    port: config.port
    nodes: 4
  }, proxy_server
###
multi_node.listen {
    port: 80
    nodes: 1
  }, http_server
  ###
