var apps = require('polo')();
var API = require('./API');
var utils = require('./utils');

// Used to prevent multiple loads
var isConfiguredAlready = false;

// Stores object once configured (returned on multiple loads)
var configuredObject = null;

// Represents all user adjustable config
// TODO: expose this via initializeAreWeGood
var config = {
  host: "arewegood.azurewebsites.net",
  port: 80,
  proxyServiceName: "arewegood-proxy",
  proxyServiceTimeout: 5000
};

module.exports = function initializeAreWeGood(apiKey) {
  if (!isConfiguredAlready) {
    // Flag used to indicate if polo finds a local proxy
    var proxyPort = -1;
    var proxyHost = -1;

    // Fired if polo succeeds
    apps.once('up', function appsUp(name, service) {
      if (name === config.proxyServiceName) {
        if (proxyPort != -1) {
          utils.log.warn("found "+name+", but direct connection already made. consider changing proxyServiceTimeout");
        } else {
          proxyPort = service.port;
          proxyHost = service.host;
          configuredObject = (configuredObject) ? new API(configuredObject) : new API(proxyHost, proxyPort);
        }
      }
    });

    // Otherwise we fall back onto a direct connection
    // TODO: implement backoff/retry logic here
    setTimeout(function waitForProxy() {
      if (proxyPort === -1) {
        proxyPort = config.port;
        proxyHost = config.host;
        configuredObject = new API(proxyHost, proxyPort);
      }
    }, config.proxyServiceTimeout);

    // Set our flag indicating don't do this work again
    isConfiguredAlready = true;
  }

  // Return an object with our exposed API all assembled (corked up)
  // When one of the above callbacks is fired, the corked version
  // will wait for connection (ws first, then REST)
  // once connected, it will be uncorked, and begin actual writes
  configuredObject = new API();
};