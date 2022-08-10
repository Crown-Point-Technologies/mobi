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
    mockOntologyState,
    mockOntologyUtilsManager,
    mockModal,
    injectShowPropertiesFilter
} from '../../../../../../test/js/Shared';

describe('Object Property Block component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'propertyValues');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_; // TODO when upgraded to angular, code was moved into ontologyStateService
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<object-property-block selected="dvm.os.listItem.selected"></object-property-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('objectPropertyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct data', function() {
        ontologyStateSvc.listItem.objectProperties.iris = {'annotation1': '', 'default2': '', 'owl2': ''};
        this.controller.$onChanges();
        expect(this.controller.objectProperties).toEqual(['annotation1', 'default2', 'owl2']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('OBJECT-PROPERTY-BLOCK');
            expect(this.element.querySelectorAll('.object-property-block').length).toEqual(1);
            expect(this.element.querySelectorAll('.annotation-block').length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toEqual(1);
        });
        it('with a link to add an object property if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);
        });
        it('with no link to add an object property if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
        it('depending on whether the selected individual is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);

            ontologyStateSvc.isSelectedImported.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(0);
        });
        it('depending on how many datatype properties there are', function() {
            expect(this.element.find('property-values').length).toEqual(2);
            ontologyStateSvc.listItem.selected = undefined;
            this.controller.updatePropertiesFiltered();
            scope.$digest();
            expect(this.element.find('property-values').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Object Property Overlay', function() {
            this.controller.openAddObjectPropOverlay();
            expect(ontologyStateSvc.editingProperty).toEqual(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toEqual('');
            expect(ontologyStateSvc.propertyIndex).toEqual(0);
            expect(modalSvc.openModal).toHaveBeenCalledWith('objectPropertyOverlay', jasmine.any(Object), this.controller.updatePropertiesFiltered);
        });
        it('should set the correct manager values when opening the Remove Object Property Overlay', function() {
            this.controller.showRemovePropertyOverlay('key', 1);
            expect(this.controller.key).toEqual('key');
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        describe('should update vocabulary hierarchies on property removal', function() {
            beforeEach(function() {
                this.controller.key = 'prop';
                ontologyStateSvc.listItem.selected = {'@type': []};
            });
            it('if selected is a derived Concept or ConceptScheme', function() {
                ontoUtils.containsDerivedConcept.and.returnValue(true);
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('prop', {});

                ontoUtils.containsDerivedConcept.and.returnValue(false);
                ontoUtils.containsDerivedConceptScheme.and.returnValue(true);
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('prop', {});
            });
            it('unless selected is not a derived Concept or ConceptScheme', function() {
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).not.toHaveBeenCalled();
            });
        });
    });
    it('should call openAddObjectPropOverlay when the link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'openAddObjectPropOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddObjectPropOverlay).toHaveBeenCalled();
    });
});
