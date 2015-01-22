// Copyright (C) 2007-2014, GoodData(R) Corporation.
var httpProxy = require('http-proxy');

module.exports = function(host) {
    var currentHost, currentPort;

    var proxy = new httpProxy.RoutingProxy({
        target: {
            https: true
        }
    });

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

        // Remove Referer header so it's not evaluated as CSRF
        delete req.headers['referer'];

        // Proxy received request to curret backend endpoint
        proxy.proxyRequest(req, res, {
            host: currentHost,
            port: currentPort,
            target: {
                // don't choke on self-signed certificates used by *.getgooddata.com
                rejectUnauthorized: false
            }
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
