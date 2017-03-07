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
describe('Language Select directive', function() {
    var $compile, scope, element;

    beforeEach(function() {
        module('templates');
        module('languageSelect');
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
        element = $compile(angular.element('<language-select ng-model="bindModel"></string-select>'))(scope);
        scope.$digest();
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            this.controller = element.controller('languageSelect');
        });
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('language-select')).toBe(true);
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.controller = element.controller('languageSelect');
        });
        it('clear properly sets the variable', function() {
            this.controller.clear();
            scope.$apply();
            expect(scope.bindModel).toBeUndefined();
        });
    });
});