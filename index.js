var assert = require('assert'),
	Arewegood = require('./lib/arewegood'),
	instance = null;

// a glorified singleton getter
function entry (apiKey, opts) {
	if (instance === null) {
		apiKey = apiKey || process.env.AREWEGOOD_KEY;
		assert(typeof(apiKey) === "string", "apiKey should be a string");
		instance = new Arewegood(apiKey, opts);
	}
	return instance;
}

// patch through the constructor
entry.Arewegood = Arewegood;

// export
module.exports = entry;