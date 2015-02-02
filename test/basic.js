//basic.js
var sdk = require('../index')("nonsense");
var mock = require('../mocks/mock-service');
var assert = require('assert');

describe("sdk", function() {
	before(function(done) {
		mock.start(function(){ done(); });
	});

	it("should support info", function(done) {

		mock.nextData(function(obj) {
			assert.deepEqual(obj, {str:"this string", bool: true, dope: 1 }, JSON.stringify(obj));
			done();
		});
		sdk.info({str:"this string", bool: true, dope: 1 });
	});

	it("should support debug", function(done) {

		mock.nextData(function(obj) {
			assert.deepEqual(obj, {why: "not", bool: true}, JSON.stringify(obj));
			done();
		});

		sdk.debug({why:"not", bool: true});
	});

	after(function(done) {
		mock.stop(function() { done(); });
	});
});