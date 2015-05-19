/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>

var http = require('http');
var assert = require('assert');

var config = require('./config'),
	devPort = config.devPort,
	devLogger = config.devLogger;
	
var service = require('./mocks/service'); // load the mock service

var arewegood = require('../index');
var Arewegood = require('../lib/arewegood');

// test the public api
describe("index(publicApi)", function () {
	var app = service(devLogger);
	
	before(function () {
		app.__server__ = http.createServer(app).listen(devPort);
	});
	
	after(function () {
		app.__server__.close();
		delete app;
	});
	
	it("exposes ctor", function () {
		assert(arewegood.Arewegood === Arewegood, "arewegood.Arewegood should be the ctor Arewegood");
	});
	
	it("caches instance", function() {
		
		var awg = arewegood("MOCK", {name: "MOCK", logger: devLogger});
		assert(awg instanceof Arewegood, "awg should be an instance of Arewegood");
		assert(awg === arewegood(), "arewegood() should match awg");
	});
});