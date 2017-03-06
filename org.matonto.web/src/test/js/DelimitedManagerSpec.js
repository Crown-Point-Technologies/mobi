/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
describe('Delimited Manager service', function() {
    var $httpBackend,
        $httpParamSerializer,
        delimitedManagerSvc,
        windowSvc,
        mappingIRI = 'http://test.org/mapping',
        datasetRecordIRI = 'http://test.org/record';

    beforeEach(function() {
        module('delimitedManager');
        mockUtil();
        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(delimitedManagerService, _$window_, _$httpBackend_, _$httpParamSerializer_) {
            delimitedManagerSvc = delimitedManagerService;
            windowSvc = _$window_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
        });

        delimitedManagerSvc.fileName = 'test';
        delimitedManagerSvc.separator = ',';
        delimitedManagerSvc.containsHeaders = true;
    });

    describe('should upload a delimited file', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/delimited-files',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.upload({}).then(function(value) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message')
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPOST('/matontorest/delimited-files',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined;
                }).respond(200, '');
            delimitedManagerSvc.upload({}).then(function(value) {
                expect(value).toEqual('');
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a preview of an uploaded delimited file', function() {
        beforeEach(function() {
            this.rowEnd = 5;
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.previewFile(this.rowEnd).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('unless there are no rows', function(done) {
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(200, []);
            delimitedManagerSvc.previewFile(this.rowEnd).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(typeof response).toBe('string');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function() {
            var preview = [[''], [''], [''], [''], ['']];
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(200, preview);
            delimitedManagerSvc.previewFile(this.rowEnd);
            $httpBackend.flush();
            expect(_.isArray(delimitedManagerSvc.dataRows)).toBe(true);
            expect(delimitedManagerSvc.dataRows.length).toBe(preview.length);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        var fileName = 'test';
        var format = 'jsonld';
        var params = $httpParamSerializer({
            format: format,
            mappingIRI: mappingIRI,
            containsHeaders: delimitedManagerSvc.containsHeaders,
            separator: delimitedManagerSvc.separator,
            fileName: fileName
        });
        delimitedManagerSvc.mapAndDownload(mappingIRI, format, fileName);
        expect(windowSvc.location).toEqual('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + params);
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        beforeEach(function() {
            this.jsonld = '';
            this.format = 'jsonld';
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.previewMap(this.jsonld, this.format).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('as JSON-LD using mapping JSON-LD', function(done) {
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(this.jsonld, this.format).then(function(response) {
                expect(_.isArray(response)).toBe(true);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('as other formats using mapping JSON-LD', function(done) {
            this.format = 'turtle';
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(this.jsonld, this.format).then(function(response) {
                expect(_.isArray(response)).toBe(true);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should upload mapped data from an uploaded delimited file into a dataset', function() {
        beforeEach(function() {
            this.params = $httpParamSerializer({
                datasetRecordIRI: datasetRecordIRI,
                mappingIRI: mappingIRI,
                containsHeaders: delimitedManagerSvc.containsHeaders,
                separator: delimitedManagerSvc.separator
            });
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + this.params).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.mapAndUpload(mappingIRI, datasetRecordIRI).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + this.params).respond(200, []);
            delimitedManagerSvc.mapAndUpload(mappingIRI, datasetRecordIRI).then(function(response) {
                expect(true).toBe(true);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the header name of a column based on the index', function() {
        beforeEach(function() {
            this.index = 0;
        })
        it('if there are no data rows', function() {
            delimitedManagerSvc.dataRows = undefined;
            expect(delimitedManagerSvc.getHeader(this.index)).toContain('' + this.index);
        });
        it('if the data rows contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = true;
            expect(delimitedManagerSvc.getHeader(this.index)).toBe(delimitedManagerSvc.dataRows[0][this.index]);
        });
        it('if the data rows do not contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = false;
            expect(delimitedManagerSvc.getHeader(this.index)).toContain('' + this.index);
        });
    });
    it('should reset important variables', function() {
        delimitedManagerSvc.reset();
        expect(delimitedManagerSvc.dataRows).toBe(undefined);
        expect(delimitedManagerSvc.fileName).toBe('');
        expect(delimitedManagerSvc.separator).toBe(',');
        expect(delimitedManagerSvc.containsHeaders).toBe(true);
        expect(delimitedManagerSvc.preview).toBe('');
    });
});
