encode = require('./encode');

console.log(encode.encodeHost('twitter.com'));
console.log(encode.encodeHost('http://www.twitter.com'));
console.log(encode.encodeHost('http://images.facebook.com/asdfa'));
console.log(encode.encodeHost('http://groups.google.com/asdfa'));
console.log(encode.encodeHost('http://groups.goo-gle.com/asdfa'));
console.log(encode.encodeHost('http://groups.google.com.hk/asdfa'));
console.log(encode.encodeHost('http://groups.goo-gle.com.hk/asdfa'));

console.log(encode.decodeHost(encode.encodeHost('twitter.com')));
console.log(encode.decodeHost(encode.encodeHost('http://www.twitter.com')));
console.log(encode.decodeHost(encode.encodeHost('http://images.facebook.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.google.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.goo-gle.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.google.com.hk/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.goo-gle.com.hk/asdfa')));

console.log(encode.encodeScript('domain.xx="twitter.com";'));
console.log(encode.encodeScript('domain.xx="www.google.com.hk";'));
console.log(encode.encodeScript('domain.xx="www.goo-gle.com.hk";'));
