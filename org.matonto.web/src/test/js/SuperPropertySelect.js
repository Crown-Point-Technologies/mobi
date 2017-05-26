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
describe('Super Property Select directive', function() {
    var $compile, scope, element, controller, isolatedScope;

    beforeEach(function() {
        module('templates');
        module('superPropertySelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.values = [];
        scope.key = 'key';
        element = $compile(angular.element('<super-property-select values="values" key="key"></super-property-select>'))(scope);
        scope.$digest();
        controller = element.controller('superPropertySelect');
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('key should be one way bound', function() {
            isolatedScope.key = 'new';
            scope.$digest();
            expect(scope.key).toBe('key');
        });
    });
    describe('controller bound variable', function() {
        it('values should be two way bound', function() {
            controller.values = ['different'];
            scope.$apply();
            expect(scope.values).toEqual(['different']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('super-class-select')).toBe(true);
            expect(element.hasClass('advanced-language-select')).toBe(true);
        });
        it('for correct links', function() {
            expect(element.querySelectorAll('.btn-link .fa-plus').length).toBe(1);
            expect(element.querySelectorAll('.btn-link .fa-times').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.querySelectorAll('.btn-link .fa-plus').length).toBe(0);
            expect(element.querySelectorAll('.btn-link .fa-times').length).toBe(1);
        });
        it('for .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('for custom-label', function() {
            expect(element.find('custom-label').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.find('custom-label').length).toBe(1);
        });
        it('for ui-select', function() {
            expect(element.find('ui-select').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.find('ui-select').length).toBe(1);
        });
        it('for ui-select-match', function() {
            expect(element.find('ui-select-match').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.find('ui-select-match').length).toBe(1);
        });
        it('for span[title]', function() {
            expect(element.querySelectorAll('span[title]').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.querySelectorAll('span[title]').length).toBe(1);
        });
        it('for ui-select-choices', function() {
            expect(element.find('ui-select-choices').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.find('ui-select-choices').length).toBe(1);
        });
        it('for div[title]', function() {
            expect(element.querySelectorAll('div[title]').length).toBe(0);
            controller.isShown = true;
            scope.$apply();
            expect(element.querySelectorAll('div[title]').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            controller.show();
            expect(controller.isShown).toBe(true);
        });
        it('hide sets the proper variables', function() {
            controller.hide();
            expect(controller.isShown).toBe(false);
            expect(controller.values).toEqual([]);
        });
    });
});