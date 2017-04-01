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
describe('Create Concept Scheme Overlay directive', function() {
    var $compile, scope, $q, element, controller, ontologyManagerSvc, ontologyStateSvc, prefixes, splitIRIFilter, ontoUtils;
    var iri = 'iri#';

    beforeEach(function() {
        module('templates');
        module('createConceptSchemeOverlay');
        injectRegexConstant();
        injectCamelCaseFilter();
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        mockUtil();
        mockOntologyUtilsManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _prefixes_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.getDefaultPrefix.and.returnValue(iri);
        element = $compile(angular.element('<create-concept-scheme-overlay></create-concept-scheme-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createConceptSchemeOverlay');
    });

    describe('initializes with the correct values', function() {
        it('if parent ontology is opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.scheme['@id']).toBe(controller.prefix);
            expect(controller.scheme['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme']);
        });
        it('if parent ontology is not opened', function() {
            expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
            expect(controller.prefix).toBe(iri);
            expect(controller.scheme['@id']).toBe(controller.prefix);
            expect(controller.scheme['@type']).toEqual([prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('create-concept-scheme-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(element.find('advanced-language-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('createConceptSchemeOverlay');
            controller.error = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are concept', function() {
            expect(element.find('ui-select').length).toBe(1);

            ontologyManagerSvc.hasConcepts.and.returnValue(false);
            scope.$digest();
            expect(element.find('ui-select').length).toBe(0);
        });
        it('with buttons to create and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Create']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller = element.controller('createConceptSchemeOverlay');
            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should update the concept scheme id', function() {
            beforeEach(function() {
                controller.scheme['@id'] = 'test';
                controller.scheme[prefixes.dcterms + 'title'] = [{'@value': 'Name'}];
                controller.prefix = 'start';
            });
            it('unless the iri has been changed', function() {
                controller.iriHasChanged = true;
                controller.nameChanged();
                expect(controller.scheme['@id']).toEqual('test');
            });
            it('if the iri has not changed', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.scheme['@id']).toEqual(controller.prefix + controller.scheme[prefixes.dcterms + 'title'][0]['@value']);
            });
        });
        it('should change the iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.scheme['@id']).toBe('begin' + 'then' + 'end');
            expect(controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        it('should create a concept', function() {
            var listItem = {ontology: [{}], conceptHierarchy: []};
            controller.concepts = [{}];
            ontologyStateSvc.listItem = listItem;
            controller.scheme = {'@id': 'scheme'};

            controller.create();
            expect(controller.scheme.matonto.originalIRI).toEqual(controller.scheme['@id']);
            expect(controller.scheme[prefixes.skos + 'hasTopConcept']).toEqual(controller.concepts);
            expect(ontologyManagerSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, controller.scheme);
            expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(controller.scheme, controller.language);
            expect(listItem.conceptHierarchy).toContain({entityIRI: controller.scheme['@id']});
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                controller.scheme);
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith(controller.scheme['@id']);
            expect(ontologyStateSvc.showCreateConceptSchemeOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
    it('should call create when the button is clicked', function() {
        controller = element.controller('createConceptSchemeOverlay');
        spyOn(controller, 'create');

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateConceptSchemeOverlay).toBe(false);
    });
});
