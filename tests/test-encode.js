options = {serverAndPort:'posts.li'}
encode = require('../lib/encode')(options);
fs = require('fs');

console.log(encode.encodeBody(fs.readFileSync('./phoenix_plugins.bundle.js', 'utf8'), true, true));
console.log('\n============bigfile tests done==========');
console.log('\n============test encodeHost==========');
console.log(encode.encodeHost('twitter.com'));
console.log(encode.encodeHost('http://www.twitter.com'));
console.log(encode.encodeHost('http://images.facebook.com/asdfa'));
console.log(encode.encodeHost('http://groups.google.com/asdfa'));
console.log(encode.encodeHost('http://groups.goo-gle.com/asdfa'));
console.log(encode.encodeHost('http://groups.google.com.hk/asdfa'));
console.log(encode.encodeHost('http://groups.goo-gle.com.hk/asdfa'));

console.log('\n============test decodeHost==========');
console.log(encode.decodeHost(encode.encodeHost('twitter.com')));
console.log(encode.decodeHost(encode.encodeHost('http://www.twitter.com')));
console.log(encode.decodeHost(encode.encodeHost('http://images.facebook.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.google.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.goo-gle.com/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.google.com.hk/asdfa')));
console.log(encode.decodeHost(encode.encodeHost('http://groups.goo-gle.com.hk/asdfa')));

console.log('\n============test encodeScript and body==========');
console.log(encode.encodeScript('domain.xx="twitter.com";'));
console.log(encode.encodeScript('domain.xx="www.google.com.hk";'));
console.log(encode.encodeScript('domain.xx="www.goo-gle.com.hk";'));
console.log(encode.encodeScript('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) '))
console.log(encode.encodeBody('"api":"http:\\/\\/a2.twimg.com\\/a\\/1302888170\\/javascripts\\/api.bundle.js", hostname.match(/(^(www|api)\\.)?twitter\\.com$/) ', true))

console.log('\n============test decodeQuery==========');
console.log(encode.decodeQuery('pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts='))

console.log('\n============test decodePathAndQuery==========');
console.log(encode.decodePathAndQuery('/account/auth/?pstMsg=&dnConn=&continue=http%3A%2F%2Fwww.qyyqvo-myw.posts.li%2F&dsh=4529719864886304822&hl=zh-CN&timeStmp=&secTok=&GALX=x2eIIz7c7Oo&Email=gg&Passwd=gg&PersistentCookie=yes&rmShown=1&signIn=%E7%99%BB%E5%BD%95&asts='))
