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
    mockOntologyState,
    mockPropertyManager,
    mockPrefixes,
    mockOntologyUtilsManager,
    mockOntologyManager,
    mockModal,
    injectShowPropertiesFilter
} from '../../../../../../test/js/Shared';

describe('Class Axioms component', function() {
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, prefixes, ontoUtils, ontologyManagerSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'propertyValues');
        mockOntologyState();
        mockPropertyManager();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockOntologyManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _prefixes_, _ontologyUtilsManagerService_, _ontologyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'axiom1': [{'@value': 'value1'}],
            'axiom2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<class-axioms></class-axioms>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classAxioms');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        prefixes = null;
        ontoUtils = null;
        ontologyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-AXIOMS');
            expect(this.element.querySelectorAll('.class-axioms').length).toEqual(1);
        });
        it('depending on how many axioms there are', function() {
            expect(this.element.find('property-values').length).toEqual(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.selected = {
                '@id': 'classId',
                mobi: {
                    originalIRI: ''
                }
            };
        });
        it('should get the list of object property axioms', function() {
            propertyManagerSvc.classAxiomList = [{iri: 'axiom'}];
            expect(this.controller.getAxioms()).toEqual(['axiom']);
        });
        it('should open the remove overlay', function() {
            this.controller.openRemoveOverlay('key', 0);
            expect(this.controller.key).toEqual('key');
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 0);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        describe('should remove a class from the hierarchy', function() {
            beforeEach(function() {
                this.axiomObject = {'@id': 'axiom'};
            });
            it('unless the selected key is not subClassOf or the value is a blank node', function() {
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setVocabularyStuff).not.toHaveBeenCalled();

                this.controller.key = prefixes.rdfs + 'subClassOf';
                ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setVocabularyStuff).not.toHaveBeenCalled();
            });
            it('if the selected key is subClassOf and the value is not a blank node', function() {
                this.controller.key = prefixes.rdfs + 'subClassOf';
                ontologyStateSvc.flattenHierarchy.and.returnValue([{entityIRI: 'new'}]);
                this.controller.removeFromHierarchy(this.axiomObject);
                expect(ontologyStateSvc.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes, ontologyStateSvc.listItem.selected['@id'], this.axiomObject['@id']);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes);
                expect(ontologyStateSvc.listItem.classes.flat).toEqual([{entityIRI: 'new'}]);
                expect(ontologyStateSvc.setVocabularyStuff).toHaveBeenCalled();
            });
        });
    });
});