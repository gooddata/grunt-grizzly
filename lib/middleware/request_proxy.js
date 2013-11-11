// Copyright (C) 2007-2012, GoodData(R) Corporation. All rights reserved.
var httpProxy = require('http-proxy');

module.exports = function(host) {
    var currentHost = host;

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
        req.headers['host'] = currentHost;

        // Proxy received request to curret backend endpoint
        proxy.proxyRequest(req, res, {
            host: currentHost,
            port: 443,
            target: {
                // don't choke on self-signed certificates used by *.getgooddata.com
                rejectUnauthorized: false
            }
        });
    };

    requestProxy.proxy = proxy;

    requestProxy.setHost = function(value) {
        currentHost = value;
    };

    return requestProxy;
};
