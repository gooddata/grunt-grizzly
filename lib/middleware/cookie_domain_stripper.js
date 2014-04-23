// Copyright (C) 2007-2014, GoodData(R) Corporation.
module.exports = function() {
    return function(req, res, next) {
        var oldWriteHead = res.writeHead;
        res.writeHead = function(statusCode, headers) {
            // On newer versions of node.js
            // headers argument is not passed
            headers = headers || {};

            // Inspect headers and look for set-cookie header
            var cookies = headers['set-cookie'] || res.getHeader('set-cookie');
            if (cookies) {
                var modified = cookies.map(function(cookie) {
                    return cookie.replace(/(domain=[^ ]+; )/img, '');
                });

                // Set modified cookie header for both old & new node.js
                headers['set-cookie'] = modified;
                res.removeHeader('set-cookie'); //remove the original header to not have it twice in the response
                res.setHeader('set-cookie', modified);
            }

            // Call original function
            oldWriteHead.apply(res, arguments);
        };

        next();
    };
};
