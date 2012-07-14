var cluster = require('cluster')
  , os = require('os')
  , freemem = os.freemem
  , numCPUs = os.cpus().length;

var MEGA = 1024 * 1024
  , MIN_FREE_MEM = 80 * MEGA
  ;

if(process.version < 'v0.8') {
  console.error('require nodejs v0.8');
  process.exit();
}

if(cluster.isMaster) {
  function startWorkers(){
    console.log('startWorkers');
    // Fork workers
    for(var i=0; i< numCPUs; i++) {
      cluster.fork();
    }
  }

  function stopWorkers() {
    console.log('stopWorkers');
    for(var id in cluster.workers) {
      cluster.workers[id].destroy();
    }
  }

  startWorkers();

  cluster.on('death', function(worker){
      // TODO log it in another logfile
      console.log('worker ' + worker.pid + ' died');
      // cluster.fork();
  });

  // for every 10 seconds, check free memory, if too low, respawn workers
  setInterval(function(){
      if(freemem() < MIN_FREE_MEM) {
        stopWorkers();
        startWorkers();
      }
  }, 10000);
} else {
  require('./server');
}
