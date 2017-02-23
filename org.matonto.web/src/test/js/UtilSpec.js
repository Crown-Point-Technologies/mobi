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
describe('Util service', function() {
    var utilSvc, prefixes, toastr, splitIRIFilter, beautifyFilter, $filter;

    beforeEach(function() {
        module('util');
        mockPrefixes();
        injectSplitIRIFilter();
        injectBeautifyFilter();
        mockToastr();

        inject(function(utilService, _prefixes_, _toastr_, _splitIRIFilter_, _beautifyFilter_, _$filter_) {
            utilSvc = utilService;
            prefixes = _prefixes_;
            toastr = _toastr_;
            splitIRIFilter = _splitIRIFilter_;
            beautifyFilter = _beautifyFilter_;
            $filter = _$filter_;
        });
    });

    describe('should get the beautified version of an IRI', function() {
        beforeEach(function() {
            this.iri = 'iri';
        });
        it('if it has a local name', function() {
            splitIRIFilter.and.returnValue({begin: 'begin', then: 'then', end: 'end'});
            var result = utilSvc.getBeautifulIRI(this.iri);
            expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
            expect(beautifyFilter).toHaveBeenCalledWith('end');
            expect(result).toBe('end');
        });
        it('if it does not have a local name', function() {
            var result = utilSvc.getBeautifulIRI(this.iri);
            expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
            expect(beautifyFilter).not.toHaveBeenCalled();
            expect(result).toBe(this.iri);
        });
    });
    describe('should get a property value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'property';
            var entity = {'property': [{'@value': 'value'}]};
            expect(utilSvc.getPropertyValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getPropertyValue({}, 'prop')).toBe('');
        });
    });
    it('should set a property value for an entity', function() {
        var prop = 'property';
        var value = 'value';
        var entity = {};
        var expected = {'property': [{'@value': value}]};
        utilSvc.setPropertyValue(entity, prop, value);
        expect(entity).toEqual(expected);
    });
    describe('should get a dcterms property value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'prop';
            var entity = {};
            entity[prefixes.dcterms + prop] = [{'@value': 'value'}];
            expect(utilSvc.getDctermsValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getDctermsValue({}, 'prop')).toBe('');
        });
    });
    it('should set a dcterms property value for an entity', function() {
        var prop = 'prop';
        var value = 'value';
        var entity = {};
        var expected = {};
        expected[prefixes.dcterms + prop] = [{'@value': value}];
        utilSvc.setDctermsValue(entity, prop, value);
        expect(entity).toEqual(expected);
    });
    describe('getItemNamespace returns', function() {
        it('item.namespace value when present', function() {
            var result = utilSvc.getItemNamespace({namespace: 'namespace'});
            expect(result).toEqual('namespace');
        });
        it("'No namespace' when item.namespace is not present", function() {
            var result = utilSvc.getItemNamespace({});
            expect(result).toEqual('No namespace');
        });
    });
    describe('should get a dcterms property id value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'prop',
                entity = {};
            entity[prefixes.dcterms + prop] = [{'@id': 'value'}];
            expect(utilSvc.getDctermsId(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getDctermsId({}, 'prop')).toBe('');
        });
    });
    describe('should parse a link header string', function() {
        it('unless it is empty', function() {
            expect(utilSvc.parseLinks('')).toEqual({});
        })
        it('correctly', function() {
            var link = 'http://example.com';
            var links = '<' + link + '>; rel="test"';
            expect(utilSvc.parseLinks(links)).toEqual({test: link});
        });
    });
    it('should create an error toast', function() {
        utilSvc.createErrorToast('Text');
        expect(toastr.error).toHaveBeenCalledWith('Text', 'Error', {timeOut: 0});
    });
    it('should get the namespace of an iri', function() {
        var result = utilSvc.getIRINamespace('iri');
        expect(splitIRIFilter).toHaveBeenCalledWith('iri');
        expect(_.isString(result)).toBe(true);
    });
    describe('getDate should get the specified date entity', function() {
        it('when provided', function() {
            var date = '1/1/2000';
            expect(utilSvc.getDate(date, 'short')).toBe($filter('date')(new Date(date), 'short'));
        });
        it('unless it is not provided', function() {
            expect(utilSvc.getDate('')).toBe('(No Date Specified)');
        });
    });
    it('condenseCommitId returns the proper string', function() {
        var id = 'testId';
        expect(utilSvc.condenseCommitId(id)).toEqual($filter('splitIRI')(id).end.substr(0,10));
    });
});