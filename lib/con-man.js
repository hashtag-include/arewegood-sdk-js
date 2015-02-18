var util = require('util'),
    backoff = require('backoff'),
    ProviderFailedError = require('./providers/base-provider').ProviderFailedError,
    EventEmitter = require('events').EventEmitter,
    RestfulProvider = require('./providers/restful-provider'),
    MdnsWebsocketProvider = require('./providers/mdns-websocket-provider'),
    RESTFUL_PROVIDER_ENDPOINT_STRING = "https://api.arewegood.io";


// Manages all our connection oriented stuff behind the scenes
function ConMan() {
  this._useBuffer = true;
  this._buffer = [];
  this._init = false;
};

// Make ConMan derive from EventEmitter
util.inherits(ConMan, EventEmitter);

// Makes a decision to either buffer or directly send a message
// to a provider, based on it's connectivity. expects (ProviderMessage)
// or (ProviderMessage[]) or (ProviderMessage 1, ProviderMessage 2, ProviderMessage N)
// as argument(s)
ConMan.prototype.send = function() {
  if (!this._init) return this.emit('error', new Error("tried to send before init()"));

  var self = this,
      args = Array.prototype.slice.call(arguments);

  for (var i = 0 ; i < args.length ; i++) {
    var item = args[i];

    if (this._useBuffer) {
      this._buffer.push(item);
    } else {
      this.provider.send(item, function(err) {
        if (err) self.emit('error', err);
      });
    }
  }
};

// Initialize the instance with important config
// 
// takes:
// {
//    apiKey:string - the api key to use when authenticating a provider. default: null
//    useProxy:boolean - do we even bother trying the use the proxy? default: true
// }
ConMan.prototype.init = function(opts) {
  var self = this;

  this._opts = opts || {useProxy: true};

  if (this._opts.useProxy === false) {
    this.provider = new RestfulProvider(RESTFUL_PROVIDER_ENDPOINT_STRING, this._opts.apiKey);
  } else {
    this.provider = new MdnsWebsocketProvider(this._opts.apiKey);
  }

  this.provider.on('open', function() {
        self.emit('open');
  });

  this.provider.on('authorized', function() {
    console.log(self._buffer.length);
    self._useBuffer = false;
    if (self._buffer.length > 0) {
      console.log(JSON.stringify(self._buffer));
      self.provider.send(self._buffer);
    }
  });

  this.provider.on('close', function() {
    self.emit('close');
    self._useBuffer = true;
  });

  this.provider.on('error', function(e) {
    // If mdns completely fails, switch over to Restful
    if (e instanceof ProviderFailedError && e.provider instanceof MdnsWebsocketProvider) {
      self.provider = new RestfulProvider(RESTFUL_PROVIDER_ENDPOINT_STRING, self._opts.apiKey);
    }

    self.emit('error', e);
  });

  this._init = true;
};

module.exports = new ConMan();