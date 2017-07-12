'use strict';

const plan = require('flightplan');
const _ = require('lodash');
const recursiveReadSync = require('recursive-readdir-sync');
const net = require('net');
const APP_DIR = process.env.DIR || '/var/www/apps/shoprank';

let host;
console.log(process.argv[3]);

if (process.argv[3]) {
  if (!net.isIP(process.argv[3])) {
    throw new Error('Given param is no IP');
  }
  host = process.argv[3];
}

plan.target('production', {
  host: host,
  username: process.env.U || 'ubuntu',
  agentForward: true,
  agent: process.env.SSH_AUTH_SOCK,
});

plan.local('transfer', function(local) {
  let files = recursiveReadSync('./');

  files = _.filter(files, function(val) {
    return val.indexOf('node_modules') === -1 &&
      val.indexOf('bower_components') === -1 &&
      val.indexOf('config/local.json') === -1 &&
      val.indexOf('.git') === -1
    ;
  });

  console.log(files);
  local.transfer(files, APP_DIR);
});

plan.remote(['install'], function(remote) {
  remote.log('installing packages');
  remote.with('cd ' + APP_DIR, function() {
    remote.exec('npm install');
  });
});

plan.remote(['transfer', 'restart'], function(remote) {

  if (!process.env.DB_URL) {
    throw new Error('Provide db url');
  }

  remote.log('restarting app');
  remote.with('cd ' + APP_DIR, function() {
    remote.exec('pm2 delete shoprank');
    remote.exec('NODE_ENV=production DB_URL=' + process.env.DB_URL + ' PORT=4020 pm2 start app.js -i 1 --name=shoprank');
  });
});
