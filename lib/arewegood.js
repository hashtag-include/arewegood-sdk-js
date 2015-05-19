var assert = require('assert'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	os = require('os'),
	bunyan = require('bunyan'),
	Promise = require('promise'),
	hs = require('hulksmash'),
	PostConnection = require('./connections/post');

// the constructor
function Arewegood (apiKey, opts) {
	assert(typeof(apiKey) === "string", "apiKey should be a string");
	
	// this could be empty, and we're okay with that
	if (!opts) {
		opts = {};
	}
	
	// cheat so we can inline bunyan call if need be
	if (!opts.logger) {
		opts.name = opts.name || "myapp"; // name to track this app by
	}
	
	// store options
	this.opts = hs.objects({
		serviceUrl: "https://arewegood.io/", // base url for the service to log to
		pushRate: 0, // how often do we push (in ms) to the service? 0 means instantly
		silent: false, // do we not ever throw errors?
		hostname: os.hostname(), // the hostname we're running on
		platform: os.platform(), // the platform we're running on
		arch: os.arch(), // the architecture we're running on
		monitorMemory: true, // do we track memory usage?
		monitorNetwork: true, // do we track network connectivity/throughput?
		logger: bunyan.createLogger({name:opts.name}), // logging instance to log to
	}, opts);
	
	// pointer to self
	var self = this;
	
	// configure connection
	this.connection = new PostConnection(apiKey, this.opts.pushRate, this.opts.serviceUrl, this.opts.silent, this.opts.logger);
	
	// bind important connection events
	this.connection.on("valid", function (apiKey) {
		self.connected = true;
		self.emit("open", apiKey);
	});
	
	// bind 'protocol' for all events connection fires
	for (var i = 0 ; i < this.connection.events.length; i++) {
		this.connection.on(this.connection.events[i], self.emit.bind(self, "protocol"));
	}
	
	// with a PostConnection, we actually don't emit close, ever
};

// derived from EventEmitter
util.inherits(Arewegood, EventEmitter);

// provide a handy array of all the events we may fire
Arewegood.prototype.events = [
	"open",
	"close",
	"error",
	"protocol"
];

// Track custom events
Arewegood.prototype.trackEvent = function (eventName, optionalData) {
	// pointer to self
	var self = this;
	
	return new Promise(function (resolve, reject) {
		if (!self.connected) return reject(new Error("Not connected"));
		
		self.connection.send("event/"+eventName+"/", optionalData, function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};

module.exports = Arewegood;