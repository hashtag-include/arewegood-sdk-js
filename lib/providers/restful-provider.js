var util = require('util'),
    https = require('https'),
    BaseProvider = require('./base-provider').BaseProvider;

function RestfulProvider(endpoint, apiKey) {
	this._endpoint = endpoint;
	this._apiKey = apiKey;

	var self = this;

	setTimeout(function() {
	  self.emit("open");
	  self.emit("authorized");
	}, 1000);
}

util.inherits(RestfulProvider, BaseProvider);

// write json data to underlying websocket
RestfulProvider.prototype.write = function(jsonData) {
  var self = this;
  
  // todo use this._endpoint
  var options = {
    hostname: 'api.arewegood.io',
    port: 443,
    path: '/logs?access_token=' + self._apiKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': jsonData.length
    }
  };

  var req = https.request(options, function(res) {
    self.emit('error', res.statusCode);
  });

  req.on('error', function(e) {
    self.emit('error', e.message);
  });

  // write data to request body
  req.write(jsonData);
  req.end();
};

module.exports = RestfulProvider;