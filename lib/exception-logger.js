var util = require('util'),
		EventEmitter = require('events').EventEmitter,
		conman = require('./con-man');

function ExceptionLogger() {

	var self = this;

	conman.on('error', function(e) {
		self.emit('error', e);
	});

	var writers = ["trace","info","debug","error"],
		writer = function(method) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (args.length == 0) return;
			if (args.length == 1) args = args[0];
			console.log(args);
			conman.send({type: method, data: args});
		};
	
	// bind all the writers
	for (var i = 0; i < writers.length; i++) {
		self[writers[i]] = writer.bind(self, writers[i]);
	}
};

util.inherits(ExceptionLogger, EventEmitter);

module.exports = ExceptionLogger;