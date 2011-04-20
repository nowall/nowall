encode = require('../lib/encode');
fs = require('fs');

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

options = {serverAndPort:'posts.li'}
console.log(encode.encodeScript('domain.xx="twitter.com";', options));
console.log(encode.encodeScript('domain.xx="www.google.com.hk";', options));
console.log(encode.encodeScript('domain.xx="www.goo-gle.com.hk";', options));
console.log(encode.encodeScript('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) ' , options))
console.log(encode.encodeBody('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) ' , options, true))
console.log(encode.encodeBody(fs.readFileSync('./phoenix_plugins.bundle.js', 'utf8'), options, true, true));
