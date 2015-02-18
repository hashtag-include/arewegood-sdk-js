var util = require('util'),
    mdns = require('mdns'),
    WebSocket = require('faye-websocket'),
    backoff = require('backoff'),
    BaseProvider = require('./base-provider').BaseProvider,
    ProviderFailedError = require('./base-provider').ProviderFailedError,
    ProviderOfflineError = require('./base-provider').ProviderOfflineError,
    WebsocketAuthorizer = require('../authorizers/websocket-authorizer'),
    browser = mdns.createBrowser({name: "awgproxy", protocol: 'tcp'}),
    IP_ADDR_INDEX = 0; // 0=ipv4, 1=ipv6.

function MdnsWebsocketProvider(apiKey) {
  var self = this;

  browser.on('serviceUp', function(service) {
    if (self._ws) return;

    self.emit('serviceUp', service);

    self._ws = new WebSocket.Client("ws://" + service.addresses[IP_ADDR_INDEX] + ":" + service.port);
    self._ws._authorizer = new WebsocketAuthorizer(self._ws);

    self._ws.on('open', function() {
      self.emit('open');
      self._ws._authorizer.authorize(apiKey, function(err, token) {
        if (err) {
          self._ws.close();
          self.emit('error', err);
        }
        else self.emit('authorized', token);
      });
    });

    self._ws.on('close', function() {
      self._ws = null;
      self.emit('close');
      //TODO implement backoff, and only emit error when backoff fails
      self.emit('error', new ProviderFailedError("socket closed", self));
    });
  });

  browser.on('serviceDown', function(service) {
    self.emit('serviceDown', service);

    if (self._ws) {
      self._ws.close();
      self._ws = null;
    }
  });

  browser.start();
};

util.inherits(MdnsWebsocketProvider, BaseProvider);

// write json data to underlying websocket
MdnsWebsocketProvider.prototype.write = function(jsonData) {
  if (this._ws.readyState == 1) {
    if (this._ws._authorizer.authorized()) {
      this._ws.send(jsonData);
    } else {
      this.emit('error', new ProviderOfflineError("cannot send data, not authorized."));
    }
  } else {
    this.emit('error', new ProviderOfflineError("cannot send data, not connected. state: "+this._ws.readyState));
  }
};

// export our constructor
module.exports = MdnsWebsocketProvider;