// Copyright © 2014, GoodData Corporation.
'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var util = require('util');
var events = require('events');
var cookieDomainStripper = require('./middleware/cookie_domain_stripper');
var hostDetector = require('./middleware/host_detector');
var requestProxy = require('./middleware/request_proxy');
var colors = require('colors');
var _ = require('lodash');
var table = require('cli-table2');

/**
 * Creates a new grizzly server.
 *
 * @constructor
 * @param {Object} options Set of configuration options. See README.md for more information
 */
var Grizzly = function(options) {
    options = _.defaults(options, {
        root: 'base',
        host: 'secure.gooddata.com',
        port: 8443,
        cert: __dirname + '/../cert/server.crt',
        key: __dirname + '/../cert/server.key',
        keepAlive: false,
        quiet: false
    });

    // Validate & normalize options first
    this._options = this._validateOptions(options);

    // Call superclass constructor
    events.EventEmitter.call(this);
};

// Make Grizzly inherit from EventEmitter so that event handlers
// can be attached to it.
util.inherits(Grizzly, events.EventEmitter);

// Export Grizzly class
module.exports = Grizzly;

/**
 * Starts server. `start` event is emitted when server
 * actually starts to listen on specified port. If any error occurs,
 * `error` event is emitted.
 *
 * This method is chainable.
 *
 * @method start
 * @return {Grizzly} this
 */
Grizzly.prototype.start = function() {
    if (!this._server) {
        var app = this._createProxy();
        this._server = this._createServer(app);

        this._server.on('error', function(error) {
            delete this._server;

            this.emit('error', error);
        }.bind(this));

        this._server.on('listening', function() {
            this.emit('start');
        }.bind(this));

        this._server.on('close', function() {
            delete this._server;

            this.emit('stop');
        }.bind(this));

        // Start server
        this._server.listen(this._options.port);
    }

    return this;
};

Grizzly.prototype.printStartedMessage = function() {
    var infoTable = new table({
        colWidths: [23, 45],
        chars: {'top': ' ', 'top-mid': ' ', 'top-left': ' ', 'top-right': ' ', 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '', 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '', 'middle': ' ', 'right-mid': ' '}
    });

    var logo = fs.readFileSync(__dirname + '/../logo.txt').toString().replace(/G\.---\.D/, 'G.---.D'.red).toString().blue;

    var info = [
        '',
        '',
        ' GRIZZLY'.green.white,
        ' Running server on ' + 'https://localhost:'.yellow + this._options.port.toString().bold.red,
        ' Backend is ' + this._options.host.bold.blue,
        ' Root is ' + this._options.root.bold.yellow
    ].join('\n');

    infoTable.push([logo, info]);
    console.error(infoTable.toString());
};

/**
 * Stops server.
 * `close` event is emitted when server actually stops listening.
 * This method is not thread safe, i.e. Calling stop() and start()
 * in quick succession (start() is called before server actually stops)
 * does not make server start again. You have to wait for `close` event
 * on server to be able to start it again.
 *
 * This method is chainable.
 *
 * @method  stop
 * @return {Grizzly} this
 */
Grizzly.prototype.stop = function() {
    if (this._server) {
        this._server.close();
    }

    return this;
};

/**
 * Creates HTTPS server that passes requests to express application.
 *
 * @private
 * @param  {express} app Instance of express application
 * @return {https.Server}     HTTPS server instance
 */
Grizzly.prototype._createServer = function(app) {
    // Create server configuration
    var serverOptions = {
        cert: fs.readFileSync(this._options.cert),
        key: fs.readFileSync(this._options.key)
    };

    // Create server available on specified port
    var server = https.createServer(serverOptions, app);

    return server;
};

/**
 * Creates express applications and sets it up.
 * Sets all the routes and middleware for application.
 *
 * @private
 * @return {express} Instance of express application
 */
Grizzly.prototype._createProxy = function() {
    // Load express library
    var express = require('express'),
        http = require('http');

    // Instantiate express application
    var app = express();

    // Helper function that modifies cookie headers
    var cookieSnippet = cookieDomainStripper();

    // Helper function that modifies & proxies received requests
    var proxySnippet = requestProxy(this._options.host);

    var hostSnippet = hostDetector();
    hostSnippet.onHostChanged(function(host) {
        proxySnippet.setHost(host);
    });

    // Publish some stuff for use in `stub`
    // the proxySnippet
    this.proxy = proxySnippet;

    app.grizzly = this;
    app.proxy = this.proxy; // backward compatibility

    app.use(hostSnippet);
    app.use(cookieSnippet);

    // Call stub function
    if (this._options.stub) this._options.stub(app);

    // Configure handling of static files
    var root = path.resolve(this._options.root);
    app.use(express.static(root));

    // everything else is proxied to the passed backend
    app.all('*', proxySnippet);

    return app;
};

/**
 * Validate options passed in constructor.
 * Throws an exception if any of options is invalid.
 *
 * @param  {Object} options Set of options passed in. See README.md for more information
 * @return {Object}         Valid set of options
 */
Grizzly.prototype._validateOptions = function(options) {
    var fs = require('fs');

    if (options.stub) {
        var stub = options.stub;

        if (typeof (stub) === 'string') {
            if (!fs.existsSync(stub)) throw 'Stub file not found: ' + stub;

            stub = options.stub = require(stub);
        }

        if (typeof (stub) !== 'function') throw 'Stub is not a function: ' + stub;
    }

    if (!fs.existsSync(options.cert)) throw 'No certificate file: ' + options.cert;
    if (!fs.existsSync(options.key)) throw 'No key file: ' + options.key;

    if (typeof (options.port) !== 'number' || options.port < 1) throw 'Invalid port: ' + options.port;

    return options;
};
