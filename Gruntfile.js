// Copyright (C) 2007-2017, GoodData(R) Corporation.
module.exports = function (grunt) {

    // Load all required tasks
    grunt.loadTasks('tasks');

    // Default task
    grunt.registerTask('default', ['grizzly:keepAlive']);
};
