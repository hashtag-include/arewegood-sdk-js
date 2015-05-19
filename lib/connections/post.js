var assert = require('assert'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	request = require('request'),
	backoff = require('backoff'),
	normalizePath = require('../normalize-path').path,
	normalizeHost = require('../normalize-path').fqdn;

// an object that is also an event emitter. for use as buffer
function BufCtor() {
	this.entries = {};
}
util.inherits(BufCtor, EventEmitter);


// represents a connection that uses HTTP POST as its upload style
function PostConnection (apiKey, pushRate, serviceUrl, silent, logger) {
	assert(typeof(pushRate) === "number", "pushRate should be a number");
	assert(typeof(serviceUrl) === "string", "serviceUrl should a string");
	
	// since we use this soon, let's do it first
	this.logger = logger;
	
	// we use this normalized path, from now on (<path>/)
	var normalServiceUrl = normalizeHost(serviceUrl);
	
	// log about it, if we made a fix
	if (normalServiceUrl !== serviceUrl) {
		this.logger.warn({original: serviceUrl, normalized: normalServiceUrl}, "Normalized serviceUrl");
	}
	
	// map our options to ourself
	this.pushRate = pushRate;
	this.serviceUrl = normalServiceUrl;
	this.silent = silent;
	this.apiKey = apiKey;
	
	// a self pointer for use below
	var self = this;
	
	
	// the readyState is a state flag that tells us when the connection is ready for use
	// however, we currently (5/18/2015) only use it internally to help know when to fire 'response'
	self.readyState = self.AUTHENTICATE;

	// validate connection (bypass send, so we don't worry about pushRate)
	this._internalSend("", JSON.stringify({}), function (err, data) {
		if (!err) {
			self.logger.debug({apiKey: self.apiKey, serviceUrl: self.serviceUrl}, "Valid connection");
			self.readyState = self.READY;
			self.emit("valid", self.apiKey);
		} else {
			self.logger.debug({apiKey: self.apiKey, serviceUrl: self.serviceUrl}, "invalid connection");
			if (!self.silent) {
				self.emit('error', new Error("invalid apiKey given"));
			}
		}
	});
}

// derive from event emitter
util.inherits(PostConnection, EventEmitter);

// provide a handy list of events that can be fired
PostConnection.prototype.events = [
	"valid",
	"error",
	"request",
	"response"
];

// state flags for readyState property
PostConnection.prototype.READY = 0; // use the conn!
PostConnection.prototype.AUTHENTICATE = 1; // not quite ready for use

// send data to the service, batching into pushRate bursts
PostConnection.prototype.send = function (path, obj, cb) {
	if (typeof(cb) === "undefined") {
		// mock cb to do nothing
		cb = function(){};
	}
	
	if (!this._buf) {
		this._buf = new BufCtor();
	}
	
	// we use this normalized path, from now on (<path>/)
	var eventPath = normalizePath(path);
	
	// log about it, if we made a fix
	if (eventPath !== path) {
		this.logger.warn({original: path, normalized: eventPath}, "Normalized path");
	}
	
	// if we don't have a buf entry for the normalized path, make one
	if (!this._buf.entries[eventPath]) {
		this._buf.entries[eventPath] = [];
	}
	// and add our data to it
	this._buf.entries[eventPath].push(obj);
	
	// and register our callback as an event
	this._buf.once(eventPath, cb);
	
	if (this.pushRate > 0 && !this._sendInterval) {
		//pointer to self
		var self = this;
		
		// set interval
		this._sendInterval = setInterval(function () {
			// stop our loop if there's no data
			if (!self._buf || Object.keys(self._buf.entries).length === 0) {
				clearInterval(self._sendInterval);
				self._sendInterval = null;
				delete self._buf;
				return;
			}
			
			// loop all eventPaths
			for (var prop in self._buf.entries) {
				var batched = [];
				
				// loop their contents
				if (self._buf.entries.hasOwnProperty(prop) && self._buf.entries[prop].length)
				for (var i = 0; i < self._buf.entries[prop].length; i++) {
					batched.push(self._buf.entries[prop][i]);
				}
				
				// encode our data
				var encoded = "";
				try{
					encoded = JSON.stringify(batched);
				} catch (e) {
					this.logger.warn({object: batched, error: e}, "failed to JSON.stringify");
					self._buf.emit(eventPath, e);
				}
				
				// and send it, triggering our event (eventPath) on completion
				if (encoded.length > 0) {
					self._internalSend(eventPath, encoded, self._buf.emit.bind(self._buf, eventPath));
				}
			}
			
			// then clear our the buffer (yes, on edge case this can cause data loss. we are ok with this for now)
			// WATCH
			delete self._buf;
		}, this.pushRate);
	} else {
		// we don't buffer
		// encode our data
		var encoded = JSON.stringify([obj]);
		
		// and send it, triggering our event (eventPath) on completion
		this._internalSend(eventPath, encoded, this._buf.emit.bind(this._buf, eventPath));
	}
};

// [internal] send data direct to the service
PostConnection.prototype._internalSend = function (path, jsonData, cb) {
	// check args
	assert(typeof(path) === "string", "path should be a string");
	assert(typeof(jsonData) === "string", "jsonData should be an string");
	if (typeof(cb) !== "undefined") {
		assert(typeof(cb) === "function", "cb should be a function");
	}
	
	// fire the request events, before we do it
	this.emit("request", {
		path: path,
		jsonData: jsonData
	});
	
	// pointer to self
	var self = this;
	this.logger.fatal({json: jsonData}, "data");
	// make request, using backoff in case of failure
	var call = backoff.call(request.post, {url: this.serviceUrl+path, auth: {bearer: this.apiKey}, json: jsonData}, function(err, res) {
	 	self.logger.fatal({err: err, res: res},"res");
	 	// if something goes wrong, fail
	    if (err) {
		    self.logger.trace({retryCount: call.getNumRetries(), error: err}, "send error");
			cb(err);
	    } else {
			
			// fire the response events, before we cb
			if (self.readyState !== self.AUTHENTICATE) {
				self.emit("response", res);
			}
			
			// cb, based on status code
			if (res.statusCode.toString().indexOf("2") === 0) {
	        	self.logger.trace({retryCount: call.getNumRetries(), statusCode: res.statusCode}, "send success");
				cb(null, res);
			} else {
	        	self.logger.trace({retryCount: call.getNumRetries(), statusCode: res.statusCode}, "send failure");
				cb(new Error("statusCode "+res.statusCode+" invalid"));	
			}
	    }
	});
	
	// make the strategy
	var strat = new backoff.ExponentialStrategy();
	call.on('fail', function(err) {
		self.logger.trace("send failed, too many tries");
		cb(err);
	});
	
	//set it and start
	call.setStrategy(strat);
	call.failAfter(4);
	call.start();
};

module.exports = PostConnection;