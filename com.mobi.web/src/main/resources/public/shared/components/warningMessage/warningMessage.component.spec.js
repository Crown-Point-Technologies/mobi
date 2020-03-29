/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Warning Message component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<warning-message></warning-message>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping-containers', function() {
            expect(this.element.prop('tagName')).toEqual('WARNING-MESSAGE');
            expect(this.element.querySelectorAll('.warning-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.text-warning').length).toEqual(1);
        });
        it('with a i.fa-warning', function() {
            var items = this.element.find('i');
            expect(items.length).toEqual(1);
            expect(items.hasClass('fa-warning')).toEqual(true);
        });
        it('with a span', function() {
            expect(this.element.find('span').length).toEqual(1);
        });
    });
});