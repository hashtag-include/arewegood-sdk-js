/// <reference path="../../typings/node/node.d.ts"/>
/// <reference path="../../typings/mocha/mocha.d.ts"/>

var http = require('http');
var assert = require('assert');

var config = require('../config'),
	devPort = config.devPort,
	devLogger = config.devLogger;
	
var service = require('../mocks/service'); // load the mock service

var Arewegood = require('../../lib/arewegood');

// test the api object
describe("Arewegood", function () {
	var app = service(devLogger);
	
	before(function () {
		app.__server__ = http.createServer(app).listen(devPort);
	});
	
	after(function () {
		app.__server__.close();
		delete app;
	});
	
	it("fires open", function (done) {
		var a = new Arewegood("MOCK", {
			name: "MOCK",
			logger: devLogger,
			serviceUrl: "http://localhost:"+devPort+"/"
		});
		a.on('open', function() {
			done();
		});
	});
	
	it("supports events", function (done) {
		var a = new Arewegood("MOCK", {
			name: "MOCK",
			logger: devLogger,
			serviceUrl: "http://localhost:"+devPort+"/"
		});
		a.on('open', function() {
			a.trackEvent("testing", {testing: true}).done(function (res) {
				assert(res.statusCode === 200, "statusCode("+res.statusCode+") should be 200");
				assert(res.headers['x-mocking-id'] === "testing", "x-mocking-id("+res.headers['x-mocking-id']+") should be 'testing'");
				assert.deepEqual(res.body, [{testing: true}], "res.body("+res.body+") should be [{testing: true}]");
				done();
			}, function (err) {
				assert(typeof(err) == "undefined" || !err, "err("+err+") shouldn't exist.");
			});
		});
	});
});