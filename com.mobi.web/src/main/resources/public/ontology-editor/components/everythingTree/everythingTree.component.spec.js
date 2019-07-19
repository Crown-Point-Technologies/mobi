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
import {
    mockComponent,
    mockOntologyManager,
    mockOntologyState,
    mockOntologyUtilsManager,
    mockUtil,
    mockPrefixes,
    injectUniqueKeyFilter,
    injectIndentConstant
} from '../../../../../../test/js/Shared';

describe('Everything Tree component', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'treeItem');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockUtil();
        mockPrefixes();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        ontologyManagerSvc.hasNoDomainProperties.and.returnValue(true);
        ontologyStateSvc.getOpened.and.returnValue(true);
        ontologyStateSvc.getNoDomainsOpened.and.returnValue(true);
        scope.hierarchy = [{
            '@id': 'class1',
            hasChildren: true,
            indent: 0,
            path: ['recordId']
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            path: ['recordId', 'class1']
        }, {
            title: 'Properties',
            get: jasmine.createSpy('get').and.returnValue(true),
            set: jasmine.createSpy('set')
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened
        }];
        scope.updateSearch = jasmine.createSpy('updateSearch');
        this.element = $compile(angular.element('<everything-tree hierarchy="hierarchy" update-search="updateSearch(value)"></everything-tree>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('everythingTree');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('hierarchy should be one way bound', function() {
            this.controller.hierarchy = [];
            scope.$digest();
            expect(angular.copy(scope.hierarchy)).toEqual([{
                '@id': 'class1',
                hasChildren: true,
                indent: 0,
                path: ['recordId'],
                isOpened: true
            }, {
                '@id': 'property1',
                hasChildren: false,
                indent: 1,
                path: ['recordId', 'class1'],
                isOpened: true
            }, {
                title: 'Properties',
                get: jasmine.any(Function),
                set: jasmine.any(Function),
                isOpened: true
            }, {
                '@id': 'property1',
                hasChildren: false,
                indent: 1,
                get: ontologyStateSvc.getNoDomainsOpened,
                isOpened: true
            }]);
        });
        it('updateSearch should be called in the parent scope', function() {
            this.controller.updateSearch({value: 'value'});
            expect(scope.updateSearch).toHaveBeenCalledWith('value');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isShown').and.returnValue(true);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('EVERYTHING-TREE');
            expect(this.element.querySelectorAll('.tree').length).toEqual(1);
            expect(this.element.querySelectorAll('.everything-tree').length).toEqual(1);
            expect(this.element.querySelectorAll('.hierarchy-tree').length).toEqual(1);
            expect(this.element.querySelectorAll('.h-100').length).toEqual(1);
        });
        it('based on .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toEqual(1);
        });
        it('based on .tree-items', function() {
            expect(this.element.querySelectorAll('.tree-item').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('toggleOpen should set the correct values', function() {
            spyOn(this.controller, 'isShown').and.returnValue(false);
            var node = {isOpened: false, path: ['a', 'b']};
            this.controller.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith('a.b', true);
            expect(this.controller.isShown).toHaveBeenCalled();
            expect(this.controller.filteredHierarchy).toEqual([]);
        });
        describe('searchFilter', function() {
            beforeEach(function() {
                this.filterNodeParent = {
                    indent: 0,
                    '@id': 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri']
                };
                this.filterNode = {
                    indent: 1,
                    '@id': 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                };
                this.filterNodeFolder = {
                    title: 'Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.controller.hierarchy = [this.filterNodeParent, this.filterNode, this.filterNodeFolder];
                this.controller.filterText = 'ti';
                ontologyManagerSvc.entityNameProps = [prefixes.dcterms + 'title'];
            });
            describe('has filter text', function() {
                describe('and the node has matching search properties', function() {
                    it('that have at least one matching text value', function () {
                        expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
                        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.filterNode.path[0] + '.' + this.filterNode.path[1], true);
                    });
                    describe('that do not have a matching text value', function () {
                        beforeEach(function () {
                            delete this.filterNode[prefixes.dcterms + 'title'];
                            utilSvc.getBeautifulIRI.and.returnValue('id');
                        });
                        describe('and does not have a matching entity local name', function () {
                            it('and the node has no children', function () {
                                expect(this.controller.searchFilter(this.filterNode)).toEqual(false);
                            });
                            it('and the node has children', function () {
                                this.filterNode.hasChildren = true;
                                expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
                            });
                        });
                        it('and does have a matching entity local name', function() {
                            utilSvc.getBeautifulIRI.and.returnValue('title');
                            expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
                        });
                    });
                });
                it('and the node does not have matching search properties', function() {
                    ontologyManagerSvc.entityNameProps = [];
                    expect(this.controller.searchFilter(this.filterNode)).toEqual(false);
                });
                it('and the node is a folder', function() {
                    expect(this.controller.searchFilter(this.filterNodeFolder)).toEqual(true);
                })
            });
            it('does not have filter text', function() {
                this.controller.filterText = '';
                expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
            });
        });
        describe('isShown filter', function() {
            describe('when node does not have an @id', function () {
                beforeEach(function() {
                    this.node = {};
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(true);
                });
            });
            describe('when node does have an @id and get returns true', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(true)
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                        expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(true);
                    expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            describe('when node does have an @id, does not have a get, indent is greater than 0, and areParentsOpen is true', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                });
            });
            describe('when node does have an @id, does not have a get, indent is 0, and the parent path has a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(true);
                });
            });
            describe('when node has an @id', function () {
                beforeEach(function() {
                    this.node = {'@id': 'id'};
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(false);
                });
            });
            describe('when node has a get that returns false', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(false)
                    }
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(false);
                    expect(this.node.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            describe('when node indent is greater than 0 and areParentsOpen is false', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                });
            });
            describe('when node indent is 0 and the parent path does not have a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(false);
                });
            });
            it('when all properties are filtered out', function() {
                var node = {
                    title: 'Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.controller.filterText = 'text';
                this.controller.preFilteredHierarchy = [node];
                expect(this.controller.isShown(node)).toEqual(false);
            });
        });
    });
});