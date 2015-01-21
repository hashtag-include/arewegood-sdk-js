var ping = require('ping');
var globalLogger = require('bunyan').createLogger({name:"arewegood-sdk-js"});

module.exports = {
  log: globalLogger,

  // Lightweight wrapper around ping functionality
  ping: function ping(host, times, cb) {
    for (var i = 0 ; i < times ; i++) {
      ping.sys.probe(host, cb);
    }
  }
}