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
    mockComponent,
    mockOntologyState
} from '../../../../../../test/js/Shared';

describe('Concept Scheme Hierarchy Block component', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'hierarchyTree');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<concept-scheme-hierarchy-block></concept-scheme-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptSchemeHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('updateSearch changes schemes search text', function() {
            expect(ontologyStateSvc.listItem.editorTabStates.schemes.searchText).toEqual('');
            this.controller.updateSearch('newValue');
            expect(ontologyStateSvc.listItem.editorTabStates.schemes.searchText).toEqual('newValue');
        });
        it('resetIndex resets schemes hierarchy index', function() {
            ontologyStateSvc.listItem.editorTabStates.schemes.index = 4;
            this.controller.resetIndex();
            expect(ontologyStateSvc.listItem.editorTabStates.schemes.index).toEqual(0);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CONCEPT-SCHEME-HIERARCHY-BLOCK');
            expect(this.element.querySelectorAll('.concept-scheme-hierarchy-block').length).toEqual(1);
        });
        it('depending on whether the tree is empty', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.find('hierarchy-tree').length).toEqual(0);

            ontologyStateSvc.listItem.conceptSchemes.flat = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.find('hierarchy-tree').length).toEqual(1);
        });
    });
});
