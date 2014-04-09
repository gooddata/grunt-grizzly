// Copyright (C) 2007-2014, GoodData(R) Corporation.
describe('host_detector', function() {
    var hostDetector = require('../../../lib/middleware/host_detector');
    var mockRequest = function() {
        return {
            url: '/gdc/app/account/bootstrap',
            headers: {}
        };
    };

    var mockResponse = function() {
        return {
            write: jasmine.createSpy(),
            writeHead: jasmine.createSpy(),
            end: jasmine.createSpy()
        };
    };

    var mockResponseData = function() {
        return  {
            bootstrapResource: {
                hostnameBase: 'cluster.host.name',
                current: {
                    project: {
                        content: {
                            cluster: 'some'
                        }
                    },
                    requiresRedirect: true
                }
            }
        };
    };

    beforeEach(function() {
        this.object = hostDetector();
    });

    it('should have `onHostChanged` method', function() {
        expect(this.object.onHostChanged).toEqual(jasmine.any(Function));
    });

    describe('on request', function() {
        beforeEach(function() {
            this.req = mockRequest();
            this.res = mockResponse();
            this.data = mockResponseData();
        });

        describe('when `requiresRedirect` attribute of bootstrap response is true and status code was 200', function() {
            it('should return HTTP 401 ', function() {
                var writeHead = this.res.writeHead;

                this.object(this.req, this.res, function() {});

                this.res.writeHead(200, undefined);
                this.res.write(JSON.stringify(this.data));
                this.res.end();

                expect(writeHead.callCount).toBe(1);
                expect(writeHead).toHaveBeenCalledWith(401, undefined);
            });

            it('should call callback with new server name when `requiresRedirect` attribute of bootstrap response is true and status code was 200', function() {
                var spy = jasmine.createSpy();

                this.object.onHostChanged(spy);
                this.object(this.req, this.res, function() {});

                this.res.writeHead(200);
                this.res.write(JSON.stringify(this.data));
                this.res.end();

                expect(spy.callCount).toBe(1);
                expect(spy).toHaveBeenCalledWith('some.cluster.host.name');
            });
        });

        describe('when `requiresRedirect` attribute of bootstrap response is true and status code was not 200', function() {
            it('should not return HTTP 401', function() {
                var writeHead = this.res.writeHead;

                this.object(this.req, this.res, function() {});

                this.res.writeHead(500, undefined);
                this.res.write(JSON.stringify(this.data));
                this.res.end();

                expect(writeHead.callCount).toBe(1);
                expect(writeHead).toHaveBeenCalledWith(500, undefined);
            });
        });
    });
});
