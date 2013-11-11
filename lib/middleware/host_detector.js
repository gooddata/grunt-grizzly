// Copyright (C) 2007-2012, GoodData(R) Corporation. All rights reserved.

module.exports = function() {
    // Function called when host change is detected
    var onHostChangedCallback = null;

    // Helper function that returns true if bootstrap was requested
    var isBootstrapRequest = function isBootstrapRequest(req) {
        return !!req.url.match('/gdc/app/account/bootstrap');
    };

    var hostDetector = function(req, res, next) {
        // Only intercept request if it's a request for bootstrap
        if (!isBootstrapRequest(req)) {
            next();

            return;
        }

        // Make sure that we get uncompressed data
        req.headers['accept-encoding'] = 'identity';

        // Create empty buffer
        var responseBody = '';

        // Original response status code will be stored here
        var responseCode = null;

        // Response headers will be stored here
        var responseHeaders = null;

        // Override response writeHead method
        // Don't call original writeHead method now since it would send response
        // headers. We have to inspect bootstrap and possibly send 401 header
        // in order to refetch bootstrap in case we needed to switch hosts
        var oldWriteHead = res.writeHead;
        res.writeHead = function(statusCode, headers) {
            responseCode = statusCode;
            responseHeaders = headers;
        };

        // Override response end method
        // Inspect bootstrap resource - switch hosts and send 401 if redirect is needed
        // We need to send 401 to the client to force it to reload the bootstrap resource
        // since the original one contains different permissions (most importantly
        // canAccessWorkbench is false since requested project is on different data center)
        var oldEnd = res.end;
        res.end = function(data, encoding) {
            // Original end method calls write if data is passed
            if (data) res.write(data, encoding);

            // Only inspect body if we got HTTP 200 from backend
            if (responseCode === 200) {
                var json = JSON.parse(responseBody);
                var bootstrap = json.bootstrapResource;
                var current = bootstrap.current;
                var redirect = current.requiresRedirect;

                if (redirect) {
                    // Fetch info on project cluster
                    var project = current.project;
                    var cluster = project.content.cluster;
                    var hostnameBase = bootstrap.hostnameBase;

                    // Construct full project host name
                    var host = cluster ? cluster + '.' + hostnameBase : hostnameBase;

                    // Send 401 if redirect is needed
                    // Client should treat this as if token has expired
                    // and should retry original request. Meanwhile
                    // we should change proxy endpoint to currently detected host
                    responseCode = 401;

                    // Call callback to notify about host change
                    onHostChangedCallback && onHostChangedCallback.call(res, host);
                }
            }

            // Write headers after we've inspected response body
            if (!res.headersSent) oldWriteHead.call(res, responseCode, responseHeaders);

            // Write response body
            if (responseBody) oldWrite.call(res, new Buffer(responseBody));

            // Call original end without optional data argument
            // since we've already written them in overridden method
            oldEnd.apply(res);
        };

        var oldWrite = res.write;
        res.write = function(data, encoding, fd) {
            responseBody += data.toString();
        };

        next();
    };

    hostDetector.onHostChanged = function(callback) {
        onHostChangedCallback = callback;
    };

    return hostDetector;
};
