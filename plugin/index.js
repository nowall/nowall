var exports = module.exports = function(options) {
  var plugins = [];

  return {
    handle: function(req, res, sreq, sres, snext, logger) {
      var index = 0;

      var ctx = {
        creq : req
      , cres : res
      , sreq : sreq
      , sres : sres
      };

      function next(err) {
        if(err) return snext(err);

        if(index >= plugins.length) {
          return snext();
        }

        var plugin = plugins[index++];
        if(!plugin) {
          console.dir(plugins);
          throw new Error('no plugin at ' + index);
        }

        plugin.call(ctx, ctx.creq, ctx.cres, ctx.sreq, ctx.sres, next, logger);
      }

      next();

    }
  , use: function(plugin) {
      plugins.push(plugin);
      return this;
    }
  }

}

exports.headers = require('./headers');
exports.stream = require('./stream');
exports.youtube = require('./youtube');
exports.twitter = require('./twitter');
exports.cookie = require('./cookie');
exports.ga = require('./ga');
exports.bodyEncoder = require('./bodyencoder').bodyEncoder;
