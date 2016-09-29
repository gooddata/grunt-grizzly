// Copyright (C) 2007-2014, GoodData(R) Corporation.

var path = require('path');

module.exports = function(grunt) {

    // Load all required tasks
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.initConfig({
        jshint: {
            all: ['tasks/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: true
            }
        },
        jasmine_node: {
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'spec'
            },
            all: ['test/']
        }
    });

    // Default task.
    grunt.registerTask('default', ['grizzly:keepAlive']);

    grunt.registerTask('hint', ['jshint:all']);

    grunt.registerTask('test', ['hint', 'jasmine_node']);
};
