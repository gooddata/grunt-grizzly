// Copyright (C) 2007-2017, GoodData(R) Corporation.
module.exports = function(grunt) {

    // Load all required tasks
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-jasmine-node');

    grunt.initConfig({
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

    // Default task
    grunt.registerTask('default', ['grizzly:keepAlive']);

    grunt.registerTask('test', ['jasmine_node']);
};
