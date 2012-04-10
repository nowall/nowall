var mongo = require('mongoskin'),
    config = require('../config');

var db = module.exports = mongo.router(function(name){
    switch(name){
    case 'user':
    case 'payment':
    case 'message':
      return mongo.db(config.auth_database);
    default:
      return mongo.db(config.database);
    }
});

db.bind('user');
db.bind('payment');
db.bind('message');
