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
fdescribe('Circle Button Stack component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<circle-button-stack><span>Test</span></circle-button-stack>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CIRCLE-BUTTON-STACK');
        });
        it('with a .hidden-buttons', function() {
            expect(this.element.querySelectorAll('.hidden-buttons').length).toBe(1);
        });
        it('with a button.btn-float', function() {
            expect(this.element.querySelectorAll('button.btn-float').length).toBe(1);
        });
        it('with transcluded content', function() {
            expect(angular.element(this.element.querySelectorAll('.hidden-buttons')[0]).children().length).toEqual(1);
        });
    });
});