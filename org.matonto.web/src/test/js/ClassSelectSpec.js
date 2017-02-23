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
describe('Class Select directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        controller,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('classSelect');
        mockOntologyManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        scope.classes = [];
        scope.selectedClass = undefined;
        scope.isDisabledWhen = false;
        scope.onChange = jasmine.createSpy('onChange');
        element = $compile(angular.element('<class-select classes="classes" selected-class="selectedClass" on-change="onChange()" is-disabled-when="isDisabledWhen"></class-select>'))(scope);
        scope.$digest();
    });
    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('classes should be one way bound', function() {
            isolatedScope.classes = [{}];
            scope.$digest();
            expect(scope.classes).not.toEqual([{}]);
        });
        it('isDisabledWhen should be one way bound', function() {
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toBe(false);
        });
        it('onChange should be called in the parent scope', function() {
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('classSelect');
        });
        it('selectedClass should be two way bound', function() {
            controller.selectedClass = {};
            scope.$digest();
            expect(scope.selectedClass).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('class-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
    });
});