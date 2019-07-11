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
describe('Create Annotation Overlay component', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontology-editor', 'staticIri');
        mockComponent('ontology-editor', 'advancedLanguageSelect');
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectCamelCaseFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.iri = 'iri#';
        this.asymmetricProperty = prefixes.owl + 'AsymmetricProperty';
        this.functionalProperty = prefixes.owl + 'FunctionalProperty';
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-annotation-property-overlay close="close()" dismiss="dismiss()"></create-annotation-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createAnnotationPropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(ontologyStateSvc.getDefaultPrefix).toHaveBeenCalled();
        expect(this.controller.prefix).toEqual(this.iri);
        expect(this.controller.property['@id']).toEqual(this.controller.prefix);
        expect(this.controller.property['@type']).toEqual([prefixes.owl + 'AnnotationProperty']);
        expect(this.controller.property[prefixes.dcterms + 'title']).toEqual([{'@value': ''}]);
        expect(this.controller.property[prefixes.dcterms + 'description']).toEqual([{'@value': ''}]);
    });
    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CREATE-ANNOTATION-PROPERTY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toEqual(1);
        });
        it('with a static-iri', function() {
            expect(this.element.find('static-iri').length).toEqual(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toEqual(1);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toEqual(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = 'error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.property[prefixes.dcterms + 'title'][0]['@value'] = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the property IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();
            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toEqual(1);
            expect(angular.element(disabled[0]).text()).toEqual('Submit');
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                this.controller.property = {[prefixes.dcterms + 'title']: [{'@value': 'Name'}]};
                this.controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.property['@id']).toEqual(this.controller.prefix + this.controller.property[prefixes.dcterms + 'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                this.controller.iriHasChanged = true;
                this.controller.property['@id'] = 'iri';
                this.controller.nameChanged();
                expect(this.controller.property['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.property['@id']).toEqual('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toEqual(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions', function() {
            beforeEach(function() {
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                this.controller.property['@id'] = 'property-iri';
                this.controller.property[prefixes.dcterms + 'title'] = [{'@value': 'label'}];
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
            });
            it('if the property is an annotation property', function() {
                this.controller.property[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                this.controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.property, this.controller.language);
                expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(this.controller.property);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.property);
                expect(ontologyStateSvc.listItem.annotations.iris).toEqual({[this.controller.property['@id']]: ontologyStateSvc.listItem.ontologyId});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.property);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('property-iri');
                expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
