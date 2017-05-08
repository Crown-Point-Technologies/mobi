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

describe('Individual Tree directive', function() {
    var $compile, scope, element, ontologyStateSvc, ontologyManagerSvc, util, controller;

    beforeEach(function() {
        module('templates');
        module('individualTree');
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_;
        });

        ontologyStateSvc.listItem.flatIndividualsHierarchy = [{
            entityIRI: 'Class A',
            hasChildren: false,
            path: ['recordId', 'Class A'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A1'],
            indent: 1
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A2'],
            indent: 1
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: ['recordId', 'Class B'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1'],
            indent: 1,
            isClass: true
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1', 'Individual B1'],
            indent: 2
        }];
        ontologyStateSvc.getIndividualsOpened.and.returnValue(true);

        element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
        scope.$digest();
        controller = element.controller('individualTree');
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(controller, 'isShown').and.returnValue(true);
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('tree')).toBe(true);
            expect(element.hasClass('individual-tree')).toBe(true);
        });
        it('based on .repeater-container', function() {
            expect(element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('based on tree-items', function() {
            expect(element.find('tree-item').length).toBe(3);
        });
        it('based on .tree-item-wrapper', function() {
            expect(element.querySelectorAll('.tree-item-wrapper').length).toBe(6);
        });
        it('based on .imported', function() {
            expect(element.querySelectorAll('.imported').length).toBe(3);
            spyOn(controller, 'isImported').and.returnValue(false);
            scope.$digest();
            expect(element.querySelectorAll('.imported').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('isImported returns the correct value', function() {
            ontologyStateSvc.listItem.index = {iri: {}};
            expect(controller.isImported('iri')).toBe(false);
            expect(controller.isImported('other')).toBe(true);
        });
        describe('isShown should return', function() {
            describe('true when', function() {
                it('indent is greater than 0 and areParentsOpen is true', function() {
                    var node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(controller.isShown(node)).toBe(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(node, ontologyStateSvc.getIndividualsOpened);
                });
                it('indent is 0 and the parent path has a length of 2', function() {
                    var node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'iri']
                    };
                    expect(controller.isShown(node)).toBe(true);
                });
            });
            describe('false when', function() {
                it('indent is greater than 0 and areParentsOpen is false', function() {
                    var node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(controller.isShown(node)).toBe(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(node, ontologyStateSvc.getIndividualsOpened);
                });
                it('indent is 0 and the parent path does not have a length of 2', function() {
                    var node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    expect(controller.isShown(node)).toBe(false);
                });
            });
        });
    });
});