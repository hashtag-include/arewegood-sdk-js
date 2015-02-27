// takes things to bind to the uncaught handler instance
// returns a function that should be attached (by the consumer)
// to process.on('uncaughtException');
// 
// opts:
// {
//    logger:ExceptionLogger, //arewegood logger we log to
//    console:Object, //Console-like object that we .error to
//    exitCode:Number, //number we process.exit with
//    timeout:Number, //how long we wait before forcing process.exit
//    callOthers:Boolean, //do we call any other bound listeners if they exist?
// }
module.exports = function(opts) {
  var uncaughtHandler = function(err) {
    // report the error
    opts.console.error('error', err.stack);
    opts.logger.error(err);

    // call other uncaughtException listeners
    if (opts.callOthers) {
      var others = process.listeners('uncaughtException');
      for (var i = 0 ; i < others.length ; i++) {
        if (others[i] !== uncaughtHandler) {
          others[i](err);
        }
      }
    }

    // set a timeout to kill the app
    var kt = setTimeout(function() {
      process.exit(opts.exitCode);
    }, opts.timeout);

    // don't block on the timeout to kill the app (the following may have custom logic to kill it sooner)
    kt.unref();
  };

  return uncaughtHandler;
};