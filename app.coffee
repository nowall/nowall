require.paths.unshift __dirname + "/support/"
multi_node = require 'multi-node'
http = require 'http'
https = require 'https'
fs = require 'fs'

Proxy = require('myproxy').Proxy
proxy = new Proxy({server: 'notes.li', port: 443, useHttps: true})

options = 
  key: fs.readFileSync __dirname + "/cert/server.key"
  cert: fs.readFileSync __dirname + "/cert/server.crt"

https_server = https.createServer options, (req, res) ->
  proxy.handle(req, res)

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
    port: 443
    nodes: 4
  }, https_server

multi_node.listen {
    port: 80
    nodes: 1
  }, http_server
