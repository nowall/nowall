var config, multi_node, server;
server = module.exports = require('./server');
config = require('./config');
multi_node = require('multi-node');

if (!module.parent) {
  multi_node.listen({
      port: config.port,
      nodes: 4
    }, server);
}
