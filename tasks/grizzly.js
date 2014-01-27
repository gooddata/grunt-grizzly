// Copyright (C) 2007-2012, GoodData(R) Corporation. All rights reserved.

var fs = require('fs');
var Grizzly = require('../lib/grizzly');
var _ = require('lodash');

/**
 * grunt-grizzly
 */
module.exports = function(grunt) {
    'use strict';

    grunt.registerTask('grizzly', 'Run GoodData proxy server', function() {
        // Options passed via command line
        var cliOptions = {
            root: grunt.option('root') || grunt.option('dir'),
            host: grunt.option('backend') || grunt.option('host'),
            port: grunt.option('port'),
            cert: grunt.option('cert'),
            key: grunt.option('key'),
            keepAlive: this.flags.keepAlive,
            quiet: this.flags.quiet,
            switchPortIfUsed: false
        };

        // Grunt configuration created via grunt.initConfig
        var configOptions = grunt.config('grizzly.options') || {};

        // Check aliases
        configOptions.host = configOptions.host || configOptions.backend;
        configOptions.root = configOptions.root || configOptions.dir;

        // Create options object
        // CLI options have higher priority over grunt configuration options
        var options = _.defaults(cliOptions, configOptions);

        var done = this.async();
        var grizzly = new Grizzly(options);

        // Shutdown & notify on error
        grizzly.on('error', function(error) {
            if (error.errno === 'EADDRINUSE' && options.switchPortIfUsed) {
                options.port++;
                grizzly.start();

                console.warn('Switching grizzly port to %d'.red, options.port);
            } else {
                console.error('Grizzly error: %s', error);
                console.error('Stopping task grizzly');

                done();
            }
        });

        grizzly.on('start', function() {
            // Continue to next task if keepAlive is not set
            options.keepAlive || done();

            options.quiet || grizzly.printStartedMessage();
        });

        grizzly.on('close', function() {
            console.error('Grizzly server closed');
            console.error('Stopping task grizzly');

            done();
        });

        // Start grizzly server
        grizzly.start();
    });
};
