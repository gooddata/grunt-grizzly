// Copyright (C) 2007-2012, GoodData(R) Corporation. All rights reserved.

module.exports = function() {
    return function(req, res, next) {
        var oldWriteHead = res.writeHead;
        res.writeHead = function() {
            var cookies = res.getHeader('set-cookie');
            if (cookies) {
                var modified = cookies.map(function(cookie) {
                    return cookie.replace(/(domain=[^ ]+; )/mg, '');
                });

                res.setHeader('set-cookie', modified);
            }

            // Call original function
            oldWriteHead.apply(res, arguments);
        };

        next();
    };
};
