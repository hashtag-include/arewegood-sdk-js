var url = require('url');

module.exports = {
	path: function (path) {
		var eventPath = url.parse(path).pathname;
		if (eventPath.indexOf('/') === 0) eventPath = eventPath.substr(1, eventPath.length);
		if (eventPath.indexOf('/', eventPath.length - 1) === -1) eventPath += "/";
		return eventPath;
	},
	fqdn: function (fqdn) {
		var p = url.parse(fqdn);
		var pathNorm = p.pathname;
		if (pathNorm.indexOf('/') === 0) pathNorm = pathNorm.substr(1, pathNorm.length);
		if (pathNorm.indexOf('/', pathNorm.length - 1) === -1) pathNorm += "/";
		return p.protocol + (p.slashes ? "//" : "") + (p.auth ? p.auth+"@" : "") + p.host + pathNorm;
	}
};