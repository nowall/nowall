config = module.exports = 
  logfile: 'server.log'
  server: 'dev'
  port: 8443
  useHttps: false

config.port = config.port || 443
config.useHttps = config.useHttps || this.port == 443
config.compress = config.compress || false
if (config.port is 443 || config.port is 80)
  config.serverAndPort = config.server
else
  config.serverAndPort = config.server + ':' + config.port

config.scheme = config.useHttps and 'https' or 'http'
config.searchUrl = "#{config.scheme}://search.#{config.serverAndPort}"
config.baseUrl = "#{config.scheme}://#{config.serverAndPort}"
