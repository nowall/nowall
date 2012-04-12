var cluster = require('cluster')
  , numCPUs = require('os').cpus().length;

if(cluster.isMaster) {
  // Fork workers
  for(var i=0; i< numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker){
      // TODO log it in another logfile
      console.log('worker ' + worker.pid + ' died');
      // cluster.fork();
  });
} else {
  require('./server');
}
