module.exports = function API(proxyHost, proxyPort) {
  if (typeof(proxyHost) === "undefined" || typeof(proxyPort) === "undefined")) {
    //create new API, corked
  } else if (typeof(proxyHost) === "object" && typeof(proxyPort) === "undefined") {
    //uncork given api
  } else {
    //create new API, uncorked
  }

  //try connection, once api is "uncorked"
  //await connection
  //on connection, actually uncork api
  //send data realtime (ws == true)
  //send data RESTful (ws == false)
};