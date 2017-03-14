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
describe('Characteristics Row directive', function() {
    var $compile, scope, element, ontologyStateSvc, $filter, controller, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('characteristicsRow');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<characteristics-row></characteristics-row>'))(scope);
        scope.$digest();
        controller = element.controller('characteristicsRow');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('characteristics-row')).toBe(true);
        });
        describe('when selected is not an object or data property', function() {
            it('for a row', function() {
                expect(element.querySelectorAll('.row').length).toBe(0);
            });
            it('for a characteristics-block', function() {
                expect(element.querySelectorAll('.row').length).toBe(0);
            });
        });
        describe('when selected is an object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                scope.$apply();
            });
            it('for a row', function() {
                expect(element.querySelectorAll('.row').length).toBe(1);
            });
            it('for a characteristics-block', function() {
                expect(element.querySelectorAll('.row').length).toBe(1);
            });
        });
        describe('when selected is a data property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                scope.$apply();
            });
            it('for a row', function() {
                expect(element.querySelectorAll('.row').length).toBe(1);
            });
            it('for a characteristics-block', function() {
                expect(element.querySelectorAll('.row').length).toBe(1);
            });
        });
    });
});
