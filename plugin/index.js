var exports = module.exports = function(options) {
  var plugins = [];

  return {
    handle: function(req, res, sreq, sres, snext, logger) {
      var index = 0;
      console.log(index);

      function next() {
        if(index >= plugins.length) {
          return snext();
        }
        var plugin = plugins[index++];
        if(!plugin) {
          console.dir(plugins);
          throw new Error('no plugin at ' + index);
        }
        console.log(plugin)
        plugin(req, res, sreq, sres, next, logger);
      }

      next();

    }
  , use: function(plugin) {
      plugins.push(plugin);
      return this;
    }
  }

}

exports.youtube = require('./youtube');
exports.twitter = require('./twitter');
exports.bodyEncoder = require('./bodyencoder').bodyEncoder;
