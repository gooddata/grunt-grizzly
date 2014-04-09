// Copyright © 2014, GoodData Corporation
#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    optimist = require('optimist'),
    Grizzly = require('../lib/grizzly');

// Parse command line parameters
var argv = optimist
    .usage('Usage: $0 -b [backend] -p [port] -d [document-root]')
    .options('p', {
        alias: 'port',
        'default': 8443,
        describe: 'local port to listen on'
    })
    .options('h', {
        alias: 'help',
        describe: 'show this help'
    })
    .options('b', {
        alias: 'backend',
        'default': 'secure.gooddata.com',
        describe: 'backend host name'
    })
    .options('d', {
        alias: 'document-root',
        describe: 'document root directory to use'
    })
    .argv;

// Show usage help
if (argv.h) {
    optimist.showHelp();
    process.exit(0);
}

var port = argv.p,
    rootDir = argv.d,
    backendHost = argv.b,
    stubFilePath;

var documentRoot = argv.d;

if (!documentRoot || typeof documentRoot === 'boolean') {
    console.error('Error: You must provide document root!');
    process.exit(1);
}

if (!fs.existsSync(documentRoot)) {
    console.error('Error: Document root does not exist. Tried: ' + documentRoot);
    process.exit(1);
}

var options = {
    host: backendHost,
    port: port,
    root: documentRoot
};
var grizzly = new Grizzly(options);

// Shutdown & notify on error
grizzly.on('error', function(error) {
    console.error('Grizzly error: %s', error);
    console.error('Stopping task grizzly');
});

grizzly.on('start', function() {
    grizzly.printStartedMessage();
});

grizzly.start();
