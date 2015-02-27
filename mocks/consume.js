var sdk = require('../index')("5f91dc3de55d4b079480a0b5d1a7327e")
sdk.on('error', function(e) {
  console.log(e);
});

// verify logging
sdk.trace("started")
sdk.info("hi mom")
sdk.debug("oh no things happened")
sdk.error("really terrible things!")

// verify our binding to uncaughtException
// this guy should call any other bound handlers, before
// killing the application
process.on('uncaughtException', sdk.uncaughtHandler);
throw new Error("test123");