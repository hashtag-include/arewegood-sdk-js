var url = require('url');

function test(path) {
var eventPath = url.parse(path).pathname;
	if (eventPath.indexOf('/') === 0) eventPath = eventPath.substr(1, eventPath.length);
	if (eventPath.indexOf('/', eventPath.length - 1) === -1) eventPath += "/";
return eventPath; };


console.log(test("/mine/"));
console.log(test("/mine"));
console.log(test("mine"));

console.log(test("/mine/yours/"));
console.log(test("/mine/yours"));
console.log(test("mine/yours"));