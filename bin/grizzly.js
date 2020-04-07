#!/usr/bin/env node
// Copyright © 2014, GoodData Corporation

var path = require('path'),
    fs = require('fs'),
    Grizzly = require('../lib/grizzly'),
    yargs = require('yargs');

var argv = yargs
    .usage('Usage: $0 -b [backend] -p [port] -d [document-root]')
    .option('port', {
        alias: 'p',
        'default': 8443,
        describe: 'local port to listen on'
    })
    .option('help', {
        alias: 'h',
        describe: 'show this help'
    })
    .option('backend', {
        alias: 'b',
        'default': 'secure.gooddata.com',
        describe: 'backend host name'
    })
    .option('document-root', {
        alias: 'd',
        describe: 'document root directory to use'
    })
    .option('stub', {
        alias: 's',
        describe: 'stub file or function'
    })
    .option('cert', {
        alias: 'c',
        describe: 'path cert file'
    })
    .option('key', {
        alias: 'k',
        describe: 'path to key file'
    })
    .option('autoassignPort', {
        alias: 'a',
        describe: 'increment port number and if specified port is already in use'
    })
    .argv;

// Show usage help
if (argv.help) {
    console.log('Usage: $0 -b [backend] -p [port] -d [document-root]');
    process.exit(0);
}

var port = argv.port,
    rootDir = argv['document-root'],
    backendHost = argv.backend,
    stub = argv.stub,
    cert = argv.cert,
    key = argv.key,
    autoassignPort = argv.autoassignPort;

var documentRoot = argv['document-root'];

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
