// Copyright (C) 2007-2014, GoodData(R) Corporation.
describe('requst_proxy', function() {
    var requestProxy = require('../../../lib/middleware/request_proxy');

    beforeEach(function() {
        this.host = 'some.host.address';
        this.object = requestProxy(this.host);

        spyOn(this.object.proxy, 'web');
    });

    it('should have `setHost` method', function() {
        expect(this.object.setHost).toEqual(jasmine.any(Function));
    });

    it('should proxy request to specified host', function() {
        var anotherHost = 'another.http.host';
        this.object.setHost(anotherHost);
        this.object({method: 'GET', headers: {}}, {});

        expect(this.object.proxy.web.calls[0].args[2].target).toMatch(new RegExp(anotherHost));
    });

    it('should set host header', function() {
        var anotherHost = 'yet.another.http.host';
        this.object.setHost(anotherHost);

        var req = {method: 'DELETE', headers: {}};

        this.object(req, {});

        expect(req.headers.host).toBe(anotherHost);
    });

    it('should set content length to 0 on DELETE requests if not specified', function() {
        var req = {method: 'DELETE', headers: {}};

        this.object(req, {});

        expect(req.headers['content-length']).toBe('0');
    });

    it('should not set content length to 0 on DELETE requests if already specified', function() {
        var req = {method: 'DELETE', headers: {'content-length': '4'}};

        this.object(req, {});

        expect(req.headers['content-length']).toBe('4');
    });

    it('should proxy request to specified host', function() {
        this.object.setHost('some.host.com');
        this.object({method: 'GET', headers: {}}, {});

        expect(this.object.proxy.web.calls[0].args[2].target).toMatch(new RegExp('some.host.com'));
    });
});
