var mongo = require('mongoskin'),
    config = require('./config'),
    auth_database = mongo.db(config.auth_database),
    database = mongo.db(config.database),

auth_database.bind('user');
auth_database.bind('payment');

database.bind('user', auth_database.user);
database.bind('payment', auth_database.user);

module.exports = mongo.proxy(function(name){
    switch(name){
    case 'user':
    case 'payment':
      return auth_database
    default:
      return database
    }
  });

module.exports = mongo.proxy(auth_database, database);
