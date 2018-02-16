var pmx     = require('pmx');
var pm2     = require('pm2');
var fs      = require('fs');
var path    = require('path');
var shelljs = require('shelljs');

var conf = pmx.initModule({
  pid              : pmx.getPID(path.join(process.env.HOME, '.pm2', 'agent.pid')),
  widget : {
    type: 'generic',
    theme: ['#1d3b4a', '#1B2228', '#22bbe2', '#22bbe2'],
    logo: 'https://raw.githubusercontent.com/Unitech/pm2/master/pres/pm2-v4.png',
    pid: pmx.getPID(path.join(process.env.HOME, '.pm2', 'pm2.pid')),

    el : {
      probes  : false,
      actions : true
    },

    block : {
      errors           : true,
      main_probes : ['events/min'],
      latency          : false,
      versioning       : false,
      show_module_meta : false
    }
  }
});

pmx.configureModule({
  human_info : [
    ['Module', 'READY']
  ]
});


var probe = pmx.probe();

var pm2_procs = 0;

var metric = probe.metric({
  name  : 'Processes',
  value : function() {
    return pm2_procs;
  }
});

var event_metric = probe.meter({
  name : 'events/min'
});

pm2.connect(function() {

  pm2.launchBus(function(err, bus) {
    bus.on('*', function(event, data) {
      if (event.indexOf('log:') > -1)
        event_metric.mark();
    });
  });
  setInterval(function() {
    pm2.list(function(err, procs) {
      pm2_procs = procs.length;
    });
  }, 2000);


});

process.on('SIGINT', function() {
  pm2.disconnect();
  setTimeout(function() {
    process.exit(0);
  }, 100);
});
