var http = require('http');
var WebSocket = require('faye-websocket');
var apps = require('polo')();

module.exports = (function(){
	function Inst() {
		var self = this;
    var server = http.createServer();
    var nextDataCb = null;
    var _logger = function(){};

		self.start = function(cb) {
      server.on('upgrade', function(request, socket, body) {
        if (WebSocket.isWebSocket(request)) {
          var ws = new WebSocket(request, socket, body);
          
          ws.on('message', function(event) {
            _logger("[mock] <data>", event.data, "</data>");
            var p = JSON.parse(event.data);

            //simulate auth
            if (p.type === "api_token") {
              _logger("[mock] auth: "+p.data);
              ws.send(JSON.stringify({type:"api_token-response", status:"OK"}));
            }

            // if it's not an auth call, fire nextDataCb with it
            if (p.data.id != "api_token" && nextDataCb != null) {
              nextDataCb(p.data);
              nextDataCb = null;
            }
          });
          
          ws.on('close', function(event) {
            _logger('[mock] close', event.code, event.reason);
            ws = null;
          });
        }
      });
       
      server.listen(1337, function() {
        _logger("[mock] server up on 1337");
        apps.put({
          name: "arewegood-proxy",
          port: 1337
        });
        _logger("[mock] registered app");
        cb();
      });
		};

		self.stop = function(cb) {
      server.close();
      cb();
		};

    self.nextData = function(cb) {
      nextDataCb = cb;
    };

    self.log = function(logger) {
      _logger = logger;
    };
	};

	return new Inst();
})();