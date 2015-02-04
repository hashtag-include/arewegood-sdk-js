var sdk = require('../index')("nonsense")
sdk.log(console.log)

sdk.trace("started")
sdk.info("hi mom")
sdk.debug("oh no things happened")
sdk.error("really terrible things!")