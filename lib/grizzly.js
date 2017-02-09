// Copyright © 2014, GoodData Corporation.
'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var util = require('util');
var events = require('events');
var cookieDomainStripper = require('./middleware/cookie_domain_stripper');
var requestProxy = require('./middleware/request_proxy');
var chalk = require('chalk');
var defaults = require('lodash.defaults');
var table = require('cli-table2');
var redirect = require("express-redirect");

/**
 * Creates a new grizzly server.
 *
 * @constructor
 * @param {Object} options Set of configuration options. See README.md for more information
 */
var Grizzly = function(options) {
    options = defaults(options, {
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

    var logoString = fs.readFileSync(__dirname + '/../logo.txt').toString();
    var logo = chalk.blue(logoString).replace(/G\.---\.D/, chalk.red('G.---.D')).replace(/-'-/, chalk.grey('-\'-'));

    var info = [
        '',
        '',
        chalk.green(' GRIZZLY'),
        ' Running server on ' + chalk.yellow('https://localhost:') + chalk.bold.red(this._options.port.toString()),
        ' Backend is ' + chalk.bold.magenta(this._options.host),
        this._options.root && ' Root is ' + chalk.bold.blue(this._options.root)
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

    // Publish some stuff for use in `stub`
    // the proxySnippet
    this.proxy = proxySnippet;

    app.grizzly = this;
    app.proxy = this.proxy; // backward compatibility

    app.use(cookieSnippet);

    // Call stub function
    if (this._options.stub) this._options.stub(app);

    // Configure handling of static files
    var root = path.resolve(this._options.root);
    app.use(express.static(root));

    // redirects
    redirect(app); // mount the plugin

    app.redirect('/invite/:id', '/account.html#/registration/confirm/:id');
    app.redirect('/i/:id', '/account.html#/registration/confirm/:id');
    app.redirect('/l/:id', '/account.html#/resetPassword/:id');
    app.redirect('/p/:id', '/account.html#/invitation/:id');
    app.redirect('/login.html*', '/account.html#/login/');
    app.redirect('/registration.html*', '/account.html#/registration/');
    app.redirect('/features.html*', '/labs/apps/feature_flags/');

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
            stub = path.resolve(stub);

            if (!fs.existsSync(stub)) throw 'Stub file not found: ' + stub;

            stub = options.stub = require(stub);
        }

        if (typeof (stub) !== 'function') throw 'Stub is not a function: ' + stub;
    }

    if (!fs.existsSync(options.cert)) throw 'No certificate file: ' + options.cert;
    if (!fs.existsSync(options.key)) throw 'No key file: ' + options.key;

    var invalidPort = isNaN(options.port) || parseInt(options.port, 10) < 1;
    if (invalidPort) throw 'Invalid port: ' + options.port;

    return options;
};
