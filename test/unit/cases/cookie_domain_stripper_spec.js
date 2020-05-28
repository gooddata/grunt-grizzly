// Copyright (C) 2007-2020, GoodData(R) Corporation.
'use strict';

var cookie_domain_stripper = require('../../../lib/middleware/cookie_domain_stripper');

describe('cookie_domain_stripper', function() {
    var context = {};
    beforeEach(function() {
        context.cookieDomainStripper = cookie_domain_stripper();
    });

    it('should call original writeHead method', function () {
        var res = { writeHead: function() {}, getHeader: function() {} };
        var spy = jest.spyOn(res, 'writeHead');

        context.cookieDomainStripper({}, res, function() {});

        res.writeHead(200);

        expect(spy).toHaveBeenCalledWith(200);
    });

    it('should strip domain from `set-cookie` header', function () {
        var res = { writeHead: function() {}, setHeader: function() {}, removeHeader: function() {} };
        var spy = jest.spyOn(res, 'writeHead');

        var header = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; domain=secure.gooddata.com; secure; HttpOnly';
        var modifiedHeader = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; secure; HttpOnly';
        var headers = { 'set-cookie': [header] };
        var modifiedHeaders = { 'set-cookie': [modifiedHeader] };

        context.cookieDomainStripper({}, res, function() {});

        res.writeHead(200, headers);

        expect(spy).toHaveBeenCalledWith(200, modifiedHeaders);
    });

    it('should strip domain from `set-cookie` header when headers are passed in response object', function () {
        var res = { writeHead: function() {}, getHeader: function() { return [header]; }, setHeader: function() {}, removeHeader: function() {} };
        var spy = jest.spyOn(res, 'setHeader');
        var spy2 = jest.spyOn(res, 'removeHeader');

        var header = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; domain=secure.gooddata.com; secure; HttpOnly';
        var modifiedHeader = 'GDCAuthSST=x8qtuB7HjE1pJ4xx; path=/gdc/account; secure; HttpOnly';

        context.cookieDomainStripper({}, res, function() {});

        res.writeHead(200);

        expect(spy2).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith('set-cookie', [modifiedHeader]);
    });
});
