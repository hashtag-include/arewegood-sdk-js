var util = require('util'),
    EventEmitter = require('events').EventEmitter;

// Represents the base class for all providers
function BaseProvider() {
  // derived children should start connection and authentication logic
  // in the constructor, and emit 'open' or 'close' as a result of success 
  // or failure. backoff logic should also be implemented.
};

util.inherits(BaseProvider, EventEmitter);

// Should be overriden in providers
// 
// expects jsonData:string - a string of json to write to the provider
BaseProvider.prototype.write = function(jsonData) {
  throw new Error("Providers should override BaseProvider.prototype.write");
};

// This is the method that ConMan calls to send data to a provider
// it will check if messages are of the right type, and if so, write
// them to the provider as JSON.
// 
// This should not be overriden by providers
// 
// expects (ProviderMessage)
// or (ProviderMessage[]) or (ProviderMessage 1, ProviderMessage 2, ProviderMessage N)
// as argument(s)
BaseProvider.prototype.send = function() {
  var args = Array.prototype.slice.call(arguments);

  // if you aren't sending anything, you shouldn't be calling this
  if (args.length == 0) {
    return this.emit('error', new Error("send should be called with arguments!"));
  }

  // if we're passed an array of ProviderMessage's, extract it
  if (args.length == 1 && args[0] instanceof Array) {
    args = args[0];
  }

  // test the first instance for provider message-ness. this is a compromise in type safety and perf
  if (!ProviderMessage.IsInstance(args[0])) {
    this.emit('error', new Error("tried to send a non-ProviderMessage: "+ args[0].toString()));
  }

  //encode and write()
  var encoded = JSON.stringify(args);
  this.write(encoded);
};

// Represents complete failure in a provider, meaning
// it is not useable
function ProviderFailedError(msg, provider) {
  Error.call(this, msg);
  this.provider = provider;
};

util.inherits(ProviderFailedError, Error);

// Represents a non-connected error, where
// something is trying to be written to a disconnected provider
function ProviderOfflineError(msg) {
  Error.call(this, msg);
};

util.inherits(ProviderOfflineError, Error);

// Represents a message to be sent by a provider
function ProviderMessage(type, data) {
  this.type = type;
  this.data = data;
};

// Returns true if an object is an instance of a ProviderMessage
ProviderMessage.IsInstance = function(obj) {
  return obj instanceof ProviderMessage || (typeof(obj.type) !== "undefined" && typeof(obj.data) !== "undefined");
};

module.exports = {
  BaseProvider: BaseProvider,
  ProviderFailedError: ProviderFailedError,
  ProviderMessage: ProviderMessage,
  ProviderOfflineError: ProviderOfflineError
};