/// <reference path="../../../typings/node/node.d.ts"/>
/// <reference path="../../../typings/mocha/mocha.d.ts"/>

var http = require('http');
var assert = require('assert');

var config = require('../../config'),
	devPort = config.devPort,
	devLogger = config.devLogger;
	
var service = require('../../mocks/service'); // load the mock service

var PostConnection = require('../../../lib/connections/post');

// test the underlying connection
describe("PostConnection", function () {
	var app = service(devLogger);
	
	before(function () {
		app.__server__ = http.createServer(app).listen(devPort);
	});
	
	after(function () {
		app.__server__.close();
		delete app;
	});
	
	it("fires valid", function (done) {
		var a = new PostConnection("MOCK", 0, "http://localhost:"+devPort+"/", false, devLogger);
		
		a.on('valid', function() {
			done();
		});
	});
	
	it("fires error given invalid apiKey and silent=false", function (done) {
		var a = new PostConnection("NOTMOCK", 0, "http://localhost:"+devPort+"/", false, devLogger);
		
		a.on('error', function(e) {
			assert(/invalid apiKey given/.test(e.message), "e.message("+e.message+") should match 'invalid apiKey given'");
			done();
		});
	});
	
	it("fires request", function (done) {
		var a = new PostConnection("MOCK", 0, "http://localhost:"+devPort+"/", false, devLogger);
		a.on('request', function() {
			done();
		});
		a.send("/event/mock/", {mock: true});
	});
	
	it("fires response", function (done) {
		var a = new PostConnection("MOCK", 0, "http://localhost:"+devPort+"/", false, devLogger);
		
		a.on('response', function() {
			done();
		});
		a.send("/event/mock/", {mock: true});
	});
	
	it("respects pushRate(0)", function (done) {
		var a = new PostConnection("MOCK", 0, "http://localhost:"+devPort+"/", false, devLogger);
		
		a.send("/event/mock/", {mock: true}, function (err, res) {
			assert(typeof(err) == "undefined" || !err, "err("+err+") shouldn't exist.");
			assert(res.statusCode === 200, "statusCode("+res.statusCode+") should be 200");
			assert(res.headers['x-mocking-id'] === "mock", "x-mocking-id("+res.headers['x-mocking-id']+") should be 'mock'");
			assert.deepEqual(res.body, [{mock: true}], "res.body("+res.body+") should be [{mock: true}]");
			done();
		});
	});
	
	it("respects pushRate(1000)", function (done) {
		this.timeout(5000);
		
		var a = new PostConnection("MOCK", 1000, "http://localhost:"+devPort+"/", false, devLogger);
		
		a.send("/event/mock/", {mock: true}, function (err, res) {
			assert(typeof(err) == "undefined" || !err, "err("+err+") shouldn't exist.");
			assert(res.statusCode === 200, "statusCode("+res.statusCode+") should be 200");
			assert(res.headers['x-mocking-id'] === "mock", "x-mocking-id("+res.headers['x-mocking-id']+") should be 'mock'");
			assert.deepEqual(res.body, [{mock: true}], "res.body("+res.body+") should be [{mock: true}]");
			done();
		});
	});
});