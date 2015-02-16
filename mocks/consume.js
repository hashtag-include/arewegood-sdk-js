var sdk = require('../index')("1167891")
sdk.on('error', function(e) {
  console.log(e);
});

sdk.trace("started")
sdk.info("hi mom")
sdk.debug("oh no things happened")
sdk.error("really terrible things!")