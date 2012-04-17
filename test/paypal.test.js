var should = require('should')
describe('Paypal', function() {
    var db, ipn, paypal;
    paypal = require('../lib/paypal');
    db = {};
    ipn = paypal({
        email: 'guileen@gmail.com',
        test: true,
        exists: function(id, fn) {
          return fn(null, !!db[id]);
        }
    });
    describe('verifyBody', function() {
        it('should no gross', function(done){
            ipn.verifyBody({
                txn_id: 123,
                receiver_email: 'guileen@gmail.com',
                payment_status: 'Completed'
              }, {}, function(err) {
                should.exist(err);
                done();
            });
        })
        it('should wrong email', function(done) {
            ipn.verifyBody({
                txn_id: 123,
                receiver_email: 'guileen2@gmail.com',
                payment_status: 'Completed'
              }, {}, function(err) {
                should.exist(err)
                done()
            });
        });
        it('should error status', function(done) {
            ipn.verifyBody({
                txn_id: 123,
                receiver_email: 'guileen@gmail.com',
                payment_status: 'Sdfsaf'
              }, {}, function(err) {
                should.exist(err)
                done()
            });
        });
    });

    describe('verifyBody request', function(){
        it('should invalid txn_id', function(done) {
            db['456'] = ['has data'];
            ipn.verifyBody({
                txn_id: '456',
                receiver_email: 'guileen@gmail.com',
                payment_status: 'Completed',
                payment_gross: 20.00
              }, {}, function(err) {
                should.exist(err)
                done();
            });
        });
        // it('should duplicate', function(done) {

        //     ipn.verifyBody({
        //         txn_id: 678,
        //         receiver_email: 'guileen@gmail.com',
        //         payment_status: 'Completed',
        //         payment_gross: 20.00
        //       }, {}, function(err) {
        //         should.exist(err);
        //         done();
        //     });

        // });
    });
});
