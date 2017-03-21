#!/usr/bin/env node
// Copyright © 2014, GoodData Corporation

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
    .options('s', {
        alias: 'stub',
        describe: 'stub file or function'
    })
    .options('c', {
        alias: 'cert',
        describe: 'path cert file'
    })
    .options('k', {
        alias: 'key',
        describe: 'path to key file'
    })
    .options('a', {
        alias: 'autoassignPort',
        describe: 'increment port number and if specified port is already in use'
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
    stub = argv.s,
    cert = argv.c,
    key = argv.k,
    autoassignPort = argv.a;

var documentRoot = argv.d;

if (!documentRoot || typeof documentRoot === 'boolean') {
    console.error('Error: You must provide document root!');
    process.exit(1);
}

if (!fs.existsSync(documentRoot)) {
    console.error('Error: Document root does not exist. Tried: ' + documentRoot);
    process.exit(1);
}

if (stub && !fs.existsSync(stub)) {
    console.error('Error: Stub file does not exist. Tried: ' + stub);
    process.exit(1);
}

if (cert && !fs.existsSync(cert)) {
    console.error('Error: Cert file does not exist. Tried: ' + cert);
    process.exit(1);
}

if (key && !fs.existsSync(key)) {
    console.error('Error: Key file does not exist. Tried: ' + key);
    process.exit(1);
}

var options = {
    host: backendHost,
    port: port,
    root: documentRoot,
    stub: stub,
    cert: cert,
    key: key,
    autoassignPort: autoassignPort
};
var grizzly = new Grizzly(options);

// Shutdown & notify on error
grizzly.on('error', function(error) {
  if (error.errno === 'EADDRINUSE' && options.autoassignPort) {
    options.port++;
    console.warn('Switching grizzly port to %d', options.port);
    grizzly.start();

  } else {
    console.error('Grizzly error: %s', error);
    console.error('Stopping task grizzly');
  }
});

grizzly.on('start', function() {
    grizzly.printStartedMessage();
});

grizzly.start();
