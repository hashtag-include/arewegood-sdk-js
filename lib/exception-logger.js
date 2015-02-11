var WebSocket = require('faye-websocket'),
	Promise = require('promise'),
	serviceName = "arewegood-proxy",
	ipAddressingIndex = 0, //for ipv4, 1 for ipv6
	serviceTimeout = 2000,
	mdns = require('mdns'),
	browser = mdns.createBrowser({name: 'http', protocol: 'tcp', subtypes: ['arewegood-proxy']}),
	_browserUp = false;

module.exports = function(api_token) {
	var self = this,
		_apiToken = api_token,
		_ws = null,
		_queue = [],
		_appsUp = false,
		_logger = function(){};

	if (!_browserUp) {
		_browserUp = true;
		browser.start();
	}

	browser.on('serviceUp', function(service) {
		if (_appsUp) return;
		_appsUp = true;

		_logger("[exception-logger] connecting to");
		_logger(service);

		if (_ws && _ws.readyState === 1) return;

		// do some stuff to authenticate a socket
		// note: this is REALLY basic and suck-ish
		var _authenticate = function(socket, token) {
			return new Promise(function(resolve, reject) {
				socket.on('message', function(event) {
					var p = JSON.parse(event.data);
					_logger("[exception-logger] ", p);
					if (p.type === "api_token-response") {
						if (p.data === "OK") {
							return resolve(p.data);
						}
					}
				});
				socket.send(JSON.stringify({type: "api_token", data: token}));

				setTimeout(function() {
					reject("TIMEOUT");
				}, serviceTimeout);
			});
		};

		// do some bs to make a socket that, on close, recreates itself
		var createSocket = function(host, port) {
			_logger("[exception-logger] creating socket["+host+":"+port+"]...");

			_ws = new WebSocket.Client("ws://"+host+":"+port);
			_ws.on('open', function() {
				_logger("[exception-logger] trying to authenticate...");
				_authenticate(_ws, _apiToken).done(function(status) {
					if (_queue.length > 0 && status === "OK") {
						for (var i = 0; i < _queue.length; i++) {
							_ws.send(JSON.stringify(_queue[i]));
						};
					} //TODO else kill _ws
				});
			});
			_ws.on('close', function(event) {
				_ws = null;
				if (_appsUp) createSocket(host, port); //TODO: implement backoff logic
			});
		};

		createSocket(service.addresses[ipAddressingIndex], service.port);
	});

	browser.on('serviceDown', function(service) {
		_appsUp = false;

		if (_ws) _ws.close();
		_ws = null;
	});


	var writers = ["trace","info","debug","error"],
		writer = function(method) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (args.length == 0) return;
			if (args.length == 1) args = args[0];

			if (_ws === null) { //TODO account for auth here (might not be needed if above todo sets _ws = null)
 				_queue.push({type: method, data: args});
 				_logger("[exception-logger] queuing", args);
 			} else {
 				_ws.send(JSON.stringify({type: method, data: args}));
 				_logger("[exception-logger] sending", args);
 			}
		};
	
	// bind all the writers
	for (var i = 0; i < writers.length; i++) {
		self[writers[i]] = writer.bind(self, writers[i]);
	}

	// lets us optionally log data to this function
	self.log = function(logger) {
		_logger = logger;
	};
};