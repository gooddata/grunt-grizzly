// Copyright (C) 2007-2020, GoodData(R) Corporation.
'use strict';

var fs = require('fs');
var https = require('https');

describe('grizzly', function() {
    var Grizzly = require('../../../lib/grizzly');

    it('should throw an exception if ssl cert file does not exist', function() {
        expect(function() {
            // eslint-disable-next-line no-unused-vars
            var grizzly = new Grizzly({
                cert: '/does/not/exist',
                key: __dirname + '/../../../cert/server.key'
            });
        }).toThrow();
    });

    it('should throw an exception if ssl key file does not exist', function() {
        expect(function() {
            // eslint-disable-next-line no-unused-vars
            var grizzly = new Grizzly({
                cert: __dirname + '/../../../cert/server.crt',
                key: '/does/not/exist'
            });
        }).toThrow();
    });

    it('should throw an exception if stubs file does not exist', function() {
        expect(function() {
            // eslint-disable-next-line no-unused-vars
            var grizzly = new Grizzly({
                stub: '/does/not/exist'
            });
        }).toThrow();
    });

    describe('after created', function() {
        var context = {};
        beforeEach(function() {
            context.options = {
                key: __dirname + '/../../../cert/server.key',
                cert: __dirname + '/../../../cert/server.crt',
                port: 27000,
                root: '.'
            };

            context.https = https.createServer({
                cert: fs.readFileSync(context.options.cert),
                key: fs.readFileSync(context.options.key)
            });
            context.grizzly = new Grizzly(context.options);

            jest.spyOn(context.https, 'listen').mockReturnValue(context.https);
            jest.spyOn(context.https, 'close').mockReturnValue(context.https);
            jest.spyOn(context.grizzly, '_createServer').mockReturnValue(context.https);
        });

        it('should start server on specified port', function() {
            context.grizzly.start();

            expect(context.https.listen.mock.calls.length).toBe(1);
            expect(context.https.listen).toHaveBeenCalledWith(context.options.port);
        });

        it('should send `start` event', function(done) {
            // Register event handler on grizzly
            context.grizzly.on('start', done);

            // Start server
            context.grizzly.start();

            // Simulate HTTPS server start
            context.https.emit('listening');
        });

        it('should send `error` event', function(done) {
            // Register event handler on grizzly
            context.grizzly.on('error', done);

            // Start server
            context.grizzly.start();

            // Simulate HTTPS server error
            context.https.emit('error');
        });

        it('should send `stop` event', function(done) {
            // Register event handler on grizzly
            context.grizzly.on('stop', done);

            // Start server
            context.grizzly.start();

            // Stop server
            context.https.emit('close');
        });
    });

    describe('stubs', function() {
        var context = {}
        beforeEach(function() {
            context.options = {
                key: __dirname + '/../../../cert/server.key',
                cert: __dirname + '/../../../cert/server.crt',
                port: 27001,
                root: '.',
                stub: function () {}
            };

            jest.spyOn(context.options, 'stub').mockImplementation(function() {});

            context.https = https.createServer({
                cert: fs.readFileSync(context.options.cert),
                key: fs.readFileSync(context.options.key)
            });
            context.grizzly = new Grizzly(context.options);
        });

        it('should use stubs when provided', function() {
            context.grizzly.start();
            expect(context.options.stub).toHaveBeenCalled();
            context.grizzly.stop();
        });
    });
});
