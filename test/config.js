var fs = require('fs');
var bunyan = require('bunyan');

// these configure some development only/mock things

// remove old log (we need to do this cause otherwise a big log is made, and it slows performance, and tests timeout)
try{
fs.unlinkSync(__dirname+"/testrun.log");
} catch (e) {}

module.exports = {
	devPort: process.env.PORT || 8348, // this port is for the mock service. it needs to be open for the tests to run
	devLogger: bunyan.createLogger({name: "devLogger", src: true, stream: fs.createWriteStream(__dirname+"/testrun.log")}) // reroute all logs to file
};
