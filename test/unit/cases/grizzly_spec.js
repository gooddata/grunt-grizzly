'use strict';

var fs = require('fs');
var https = require('https');

describe('grizzly', function() {
    var Grizzly = require('../../../lib/grizzly');

    it('should throw an exception if ssl cert file does not exist', function() {
        expect(function() {
            var grizzly = new Grizzly({
                cert: '/does/not/exist',
                key: __dirname + '/../../../cert/server.key'
            });
        }).toThrow();
    });

    it('should throw an exception if ssl key file does not exist', function() {
        expect(function() {
            var grizzly = new Grizzly({
                cert: __dirname + '/../../../cert/server.crt',
                key: '/does/not/exist'
            });
        }).toThrow();
    });

    describe('after created', function() {
        beforeEach(function() {
            this.options = {
                key: __dirname + '/../../../cert/server.key',
                cert: __dirname + '/../../../cert/server.crt',
                port: 27000,
                root: '.'
            };

            this.https = https.createServer({
                cert: fs.readFileSync(this.options.cert),
                key: fs.readFileSync(this.options.key)
            });
            this.grizzly = new Grizzly(this.options);

            spyOn(this.https, 'listen').andReturn(this.https);
            spyOn(this.https, 'close').andReturn(this.https);
            spyOn(this.grizzly, '_createServer').andReturn(this.https);
        });

        it('should start server on specified port', function() {
            this.grizzly.start();

            expect(this.https.listen.callCount).toBe(1);
            expect(this.https.listen).toHaveBeenCalledWith(this.options.port);
        });

        it('should send `start` event', function(done) {
            // Register event handler on grizzly
            this.grizzly.on('start', done);

            // Start server
            this.grizzly.start();

            // Simulate HTTPS server start
            this.https.emit('listening');
        });

        it('should send `error` event', function(done) {
            // Register event handler on grizzly
            this.grizzly.on('error', done);

            // Start server
            this.grizzly.start();

            // Simulate HTTPS server error
            this.https.emit('error');
        });

        it('should send `stop` event', function(done) {
            // Register event handler on grizzly
            this.grizzly.on('stop', done);

            // Start server
            this.grizzly.start();

            // Stop server
            this.https.emit('close');
        });
    });
});
