/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import {
    mockPrefixes
} from '../../../../../../test/js/Shared';

describe('Record Keywords component', function() {
    var $compile, scope, prefixes;

    beforeEach(function() {
        angular.mock.module('shared');
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        scope.record = {};
        scope.record[prefixes.catalog + 'keyword'] = [{'@value': 'b'}, {'@value': 'a'}];
        this.element = $compile(angular.element('<record-keywords record="record"></record-keywords>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordKeywords');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            var previousRecord = angular.copy(scope.record);
            this.controller.record = {'@id': ''};
            scope.$digest();
            expect(scope.record).toEqual(previousRecord);
        });
    });
    describe('controller methods', function() {
        it('should return all the record keywords sorting alphabetically', function() {
            expect(this.controller.getKeywords()).toEqual(['a', 'b']);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'getKeywords').and.returnValue(['a', 'b']);
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-KEYWORDS');
            expect(this.element.querySelectorAll('.record-keywords').length).toEqual(1);
        });
        it('with a field-name span', function() {
            expect(this.element.querySelectorAll('span.field-name').length).toEqual(1);
        });
        it('depending on how many keywords there are', function() {
            expect(this.element.querySelectorAll('.keywords li').length).toEqual(2);

            this.controller.getKeywords.and.returnValue([]);
            scope.$digest();
            expect(this.element.querySelectorAll('.keywords li').length).toEqual(1);
        });
        it('depending on whether a list item is last', function() {
            var listItems = this.element.querySelectorAll('.keywords li');
            expect(angular.element(listItems[0]).hasClass('last')).toEqual(false);
            expect(angular.element(listItems[1]).hasClass('last')).toEqual(true);
        });
    });
});
