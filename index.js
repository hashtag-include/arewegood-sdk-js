var ExceptionLogger = require('./lib/exception-logger'),
    conman = require('./lib/con-man'),
    logger = new ExceptionLogger(),
    uncaughtHandler = require('./lib/uncaught-handler')({
      //bind these args to the uncaughtHandler instance
      logger: logger,
      timeout: 15000,
      console: console,
      exitCode: 1,
      callOthers: true
    }),
    _wasInit = false;

// set the uncaughtHandler as a property of logger
// this is so that we canreturn an object
// that is a combination of the logger and the uncaughtHandler
logger.uncaughtHandler = uncaughtHandler;

module.exports = function(apiKey) {
  if (_wasInit) return logger;  
  
  // we need to configure a new conman, to use our apiKey, and set it as the default instance
  // so that all our calls to conman.send() use the correctly configured instance
  conman.init({setDefault: true, apiKey: apiKey});

  conman.on('open', function(){ console.log("open");});
 
  _wasInit = true;
 
  // return our logger-ish object
  return logger;
};
