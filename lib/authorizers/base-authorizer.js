var util = require('util');

// Represents the base class for all Authorizers
function BaseAuthorizer() {
  // derived children should not do any work in their constructor
};

// Should be overriden in Authorizers
// 
// expects 
// apiKey:string - the apiKey to authorize with
// cb:function - a function that takes (err, token) after authorization occurs
BaseAuthorizer.prototype.authorize = function(apiKey, cb) {
  throw new Error("Authorizers should override BaseAuthorizer.prototype.authorize");
};

// Should be overriden in Authorizers
// 
// expects
// nothing, returns bool to indicate if authorized
// 
BaseAuthorizer.prototype.authorized = function() {
  throw new Error("Authorizers should override BaseAuthorizer.prototype.authorized");
};

// represents failure to authorize. should be err, in the cb above, if there is an error
function AuthorizerFailedError(msg) {
  Error.call(this, msg);
};

util.inherits(AuthorizerFailedError, Error);

module.exports = {
  BaseAuthorizer: BaseAuthorizer,
  AuthorizerFailedError: AuthorizerFailedError
};