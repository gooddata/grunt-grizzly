// Copyright (C) 2007-2020, GoodData(R) Corporation.
describe('request_proxy', function () {
    var requestProxy = require('../../../lib/middleware/request_proxy');
    var context = {};

    beforeEach(function () {
        context.host = 'some.host.address';
        context.object = requestProxy(context.host);
        jest.spyOn(context.object.proxy, 'web').mockImplementation(function () {
        });
    });

    it('should have `setHost` method', function () {
        expect(context.object.setHost).toEqual(expect.any(Function));
    });

    it('should proxy request to specified host', function () {
        var anotherHost = 'another.http.host';
        context.object.setHost(anotherHost);
        context.object({method: 'GET', headers: {}}, {});

        expect(context.object.proxy.web.mock.calls[0][2].target).toMatch(new RegExp(anotherHost));
    });

    it('should set host header', function () {
        var anotherHost = 'yet.another.http.host';
        context.object.setHost(anotherHost);

        var req = {method: 'DELETE', headers: {}};

        context.object(req, {});

        expect(req.headers.host).toBe(anotherHost);
    });

    it('should set content length to 0 on DELETE requests if not specified', function () {
        var req = {method: 'DELETE', headers: {}};

        context.object(req, {});

        expect(req.headers['content-length']).toBe('0');
    });

    it('should not set content length to 0 on DELETE requests if already specified', function () {
        var req = {method: 'DELETE', headers: {'content-length': '4'}};

        context.object(req, {});

        expect(req.headers['content-length']).toBe('4');
    });

    it('should proxy request to specified host', function () {
        context.object.setHost('some.host.com');
        context.object({method: 'GET', headers: {}}, {});

        expect(context.object.proxy.web.mock.calls[0][2].target).toMatch(new RegExp('some.host.com'));
    });

    it('should send 404 for proxied requests if host not given', function () {
        var resMock = {
            status: function () {
            },
            send: function () {
            }
        };
        jest.spyOn(resMock, 'status').mockImplementation(function() {});
        jest.spyOn(resMock, 'send').mockImplementation(function() {});

        context.object.setHost(null);
        context.object({method: 'GET', headers: {}}, resMock);

        expect(context.object.proxy.web).not.toHaveBeenCalled();
        expect(resMock.status).toHaveBeenCalledWith(404);
    });
});
