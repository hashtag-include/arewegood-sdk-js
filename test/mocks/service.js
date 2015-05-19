var express = require('express');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer');
var bodyParser = require('body-parser');

passport.use(new BearerStrategy(
  function(token, done) {
	  if (token === "MOCK") {
		  return done(null, {id: "MOCK"}, {scope: "all"});
	  } else {
		  return done(); // this keeps 
	  }
  }
));

function mock (parentBunyan) {
	var app = express();

	app.use(require('express-bunyan-logger')({logger: parentBunyan, excludes:["req","res","short-body"]}));
	app.use(passport.initialize());
	
	// mock out our production endpoints
	
	// mocks out the root api route
	app.post("/", passport.authenticate('bearer', {session: false}), function (req, res) {
		res.sendStatus(200);
	});
	
	// mocks out the event api
	app.post("/event/:event", bodyParser.json({strict:false}), function (req, res) {
		var event = req.params.event;
		
		// a glorified echo server
		res.set("X-Mocking-ID", event).status(200).send(req.body);
	});
	
	return app;
};

module.exports = mock;