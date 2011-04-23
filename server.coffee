require.paths.unshift __dirname + "/support/"
http = require 'http'
https = require 'https'
fs = require 'fs'
connect = require 'connect'
config = require './config'
proxy_server = require './proxy'
app = require './app'

config.useHttps = config.useHttps && true
config.port = config.port || if config.useHttps then 443 else 80

options = 
  key: fs.readFileSync __dirname + "/cert/server.key"
  cert: fs.readFileSync __dirname + "/cert/server.crt"

server = module.exports = connect(
  connect.logger(),
  connect.vhost(config.server, app),
  connect.vhost('*.' + config.server, proxy_server)
)

if not module.parent
  server.listen(config.port)
