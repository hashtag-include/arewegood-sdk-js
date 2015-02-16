var ExceptionLogger = require('./lib/exception-logger'),
    conman = require('./lib/con-man');


module.exports = function(api_token) {
  // we need to configure a new conman, to use our apiKey, and set it as the default instance
  // so that all our calls to conman.send() use the correctly configured instance
  conman.init({setDefault: true, apiKey: api_token});

  conman.on('open', function(){ console.log("open");});

  // for now, let's return the same interface using the new abstracted networking stuff
  // this way, our existing tests should still work
	return new ExceptionLogger();
};