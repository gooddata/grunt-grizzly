// Copyright (C) 2007-2012, GoodData(R) Corporation. All rights reserved.

var fs = require('fs');
var Grizzly = require('../lib/grizzly');

/**
 * grunt-grizzly
 */
module.exports = function(grunt) {
    'use strict';

    grunt.registerTask('grizzly', 'Run GoodData proxy server', function() {
        var util = grunt.util || grunt.utils;
        var _ = util._;

        // Default configuration options
        var defaults = {
            root: 'html',
            host: 'secure.getgooddata.com',
            port: 8443,
            cert: __dirname + '/../cert/server.crt',
            key: __dirname + '/../cert/server.key',
            keepAlive: false,
            quiet: false
        };

        // Options passed via command line
        var cliOptions = {
            root: grunt.option('root') || grunt.option('dir'),
            host: grunt.option('backend') || grunt.option('host'),
            port: grunt.option('port'),
            cert: grunt.option('cert'),
            key: grunt.option('key'),
            keepAlive: this.flags.keepAlive,
            quiet: this.flags.quiet
        };

        // Grunt configuration created via grunt.initConfig
        var configOptions = grunt.config('grizzly.options') || {};

        // Check aliases
        configOptions.host = configOptions.host || configOptions.backend;
        configOptions.root = configOptions.root || configOptions.dir;

        // Create options object
        // CLI options have higher priority over grunt configuration options
        var options = _.defaults(cliOptions, configOptions, defaults);

        // Only log to console if quiet options is false
        var log = options.quiet ? function() {} : console.log;

        var done = this.async();
        var grizzly = new Grizzly(options);

        // Shutdown & notify on error
        grizzly.on('error', function(error) {
            console.error('Grizzly error: %s', error);
            console.error('Stopping task grizzly');

            done();
        });

        grizzly.on('start', function() {
            // Continue to next task if keepAlive is not set
            if (!options.keepAlive) done();

            var yellow = '\u001b[33m',
                reset = '\u001b[0m';

            log(yellow);
            log(fs.readFileSync(__dirname + '/../paw.txt').toString());
            log(reset);
            log('Running grizzly server on \u001b[31mhttps://localhost:' + options.port + reset);
            log('Backend is \u001b[31m' + options.host + reset);
        });

        grizzly.on('close', function() {
            console.warn('Grizzly server closed');
            console.warn('Stopping task grizzly');

            done();
        });

        // Start grizzly server
        grizzly.start();
    });
};
