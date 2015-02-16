var util = require('util'),
    BaseAuthorizer = require('./base-authorizer').BaseAuthorizer,
    AuthorizerFailedError = require('./base-authorizer').AuthorizerFailedError;

// Given a websocket, authenticate it using our protocol
// when authorize is called
function WebsocketAuthorizer(ws) {
  this._ws = ws;
  this._authorized = false;
};

util.inherits(WebsocketAuthorizer, BaseAuthorizer);

// Should be overriden in Authorizers
// 
// expects 
// apiKey:string - the apiKey to authorize with
// cb:function - a function that takes (err, token) after authorization occurs
WebsocketAuthorizer.prototype.authorize = function(apiKey, cb) {
  if (!this._ws) return cb(new AuthorizerFailedError("websocket not valid"));
  if (this._ws.readyState != 1) return cb(new AuthorizerFailedError("websocket not open. state: "+this._ws.readyState));
  
  var self = this;
  var listener = function(event) {
    self._ws.removeListener('message', listener);

    var data = JSON.parse(event.data);
    if (data.type === "api_token-response" && data.data === "OK") {
      self._authorized = true;

      cb(null, data.data);
    } else {
      cb(new AuthorizerFailedError(data.data));
    }
  };

  this._ws.on('message', listener);
  this._ws.send(JSON.stringify({type:"api_token", data:apiKey}));
};

// Should be overriden in Authorizers
// 
// expects
// nothing, returns bool to indicate if authorized
// 
WebsocketAuthorizer.prototype.authorized = function() {
  return this._authorized;
}

module.exports = WebsocketAuthorizer;