'use strict';

var cookie_domain_stripper = require('../../../lib/middleware/cookie_domain_stripper');

describe('cookie_domain_stripper', function() {
    beforeEach(function() {
        this.object = cookie_domain_stripper();
    });

    it('should call original writeHead method', function () {
        var res = { writeHead: function() {}, getHeader: function() {} };
        var spy = spyOn(res, 'writeHead');

        this.object({}, res, function() {});

        res.writeHead(200);

        expect(spy).toHaveBeenCalledWith(200);
    });

    it('should strip domain from `set-cookie` header', function () {
        var res = { writeHead: function() {}, setHeader: function() {} };
        var spy = spyOn(res, 'writeHead');

        var header = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; domain=secure.gooddata.com; secure; HttpOnly';
        var modifiedHeader = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; secure; HttpOnly';
        var headers = { 'set-cookie': [header] };
        var modifiedHeaders = { 'set-cookie': [modifiedHeader] };

        this.object({}, res, function() {});

        res.writeHead(200, headers);

        expect(spy).toHaveBeenCalledWith(200, modifiedHeaders);
    });

    it('should strip domain from `set-cookie` header when headers are passed in response object', function () {
        var res = { writeHead: function() {}, getHeader: function() { return [header]; }, setHeader: function() {} };
        var spy = spyOn(res, 'setHeader');

        var header = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; domain=secure.gooddata.com; secure; HttpOnly';
        var modifiedHeader = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; secure; HttpOnly';

        this.object({}, res, function() {});

        res.writeHead(200);

        expect(spy).toHaveBeenCalledWith('set-cookie', [modifiedHeader]);
    });
});
