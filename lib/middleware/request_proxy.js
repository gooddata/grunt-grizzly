// Copyright (C) 2007-2014, GoodData(R) Corporation.
var httpProxy = require('http-proxy');

module.exports = function(host) {
    var currentHost, currentPort;

    var proxy = httpProxy.createProxyServer({});

    var requestProxy = function(req, res, next) {
        // Because backend does not answer without set content length
        if (req.method === 'DELETE') {
            // Only set content-length to zero if not already specified
            req.headers['content-length'] = req.headers['content-length'] || '0';
        }

        // White labeled resources are based on host header
        req.headers['host'] = currentHost + (currentPort!==443 ? ':'+currentPort : '');

        // Remove Origin header so it's not evaluated as cross-domain request
        req.headers['origin'] = null;

        // To prevent CSRF
        req.headers['referer'] = 'https://' + host;

        // Proxy received request to curret backend endpoint
        proxy.web(req, res, {
            target: 'https://' + currentHost + ':' + currentPort,
            // don't choke on self-signed certificates used by *.getgooddata.com
            secure: false
        });
    };

    requestProxy.proxy = proxy;

    requestProxy.setHost = function(value) {
        var splithost = value ? value.split(/:/) : '';
        currentHost = splithost[0];
        currentPort = parseInt(splithost[1] || '443', 10);
    };

    // set the host/port combination
    requestProxy.setHost(host);

    return requestProxy;
};
