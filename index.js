var ExceptionLogger = require('./lib/exception-logger');


module.exports = function(api_token) {
	return new ExceptionLogger(api_token);
};