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
describe('Create Class Overlay component', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('ontology-editor', 'staticIri');
        mockComponent('advancedLanguageSelect', 'advancedLanguageSelect');
        mockComponent('ontology-editor', 'superClassSelect');
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
        ontologyStateSvc.getDefaultPrefix.and.returnValue(this.iri);

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-class-overlay close="close()" dismiss="dismiss()"></create-class-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createClassOverlay');
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
        expect(this.controller.prefix).toBe(this.iri);
        expect(this.controller.clazz['@id']).toBe(this.controller.prefix);
        expect(this.controller.clazz['@type']).toEqual(['Class']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-CLASS-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(this.element.find('static-iri').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with an advanced-language-select', function() {
            expect(this.element.find('advanced-language-select').length).toBe(1);
        });
        it('with a super-class-select', function() {
            expect(this.element.find('super-class-select').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the class IRI already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            scope.$digest();

            var disabled = this.element.querySelectorAll('[disabled]');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Submit');
        });
    });
    describe('controller methods', function() {
        describe('nameChanged', function() {
            beforeEach(function() {
                this.controller.clazz = {[prefixes.dcterms + 'title']: [{'@value': 'Name'}]};
                this.controller.prefix = 'start';
            });
            it('changes iri if iriHasChanged is false', function() {
                this.controller.iriHasChanged = false;
                this.controller.nameChanged();
                expect(this.controller.clazz['@id']).toEqual(this.controller.prefix + this.controller.clazz[prefixes.dcterms + 'title'][0]['@value']);
            });
            it('does not change iri if iriHasChanged is true', function() {
                this.controller.iriHasChanged = true;
                this.controller.clazz['@id'] = 'iri';
                this.controller.nameChanged();
                expect(this.controller.clazz['@id']).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            this.controller.onEdit('begin', 'then', 'end');
            expect(this.controller.clazz['@id']).toBe('begin' + 'then' + 'end');
            expect(this.controller.iriHasChanged).toBe(true);
            expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
        });
        describe('create calls the correct manager functions when controller.values', function() {
            beforeEach(function() {
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'entity'}]);
                this.controller.language = 'en';
                this.controller.clazz = {
                    '@id': 'class-iri',
                    [prefixes.dcterms + 'title']: [{'@value': 'label'}],
                    [prefixes.dcterms + 'description']: [{'@value': 'description'}]
                };
            });
            it('is empty', function() {
                this.controller.create();
                expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes);
                expect(ontologyStateSvc.listItem.classes.flat).toEqual([{prop: 'entity'}]);
                expect(scope.close).toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.setSuperClasses).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('class-iri');
                expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            });
            describe('has values', function() {
                beforeEach(function () {
                    this.controller.values = [{'@id': 'classA'}];
                });
                it('including a derived concept', function() {
                    ontoUtils.containsDerivedConcept.and.returnValue(true);
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                    expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(_.get(this.controller.clazz, prefixes.rdfs + 'subClassOf')).toEqual([{'@id': 'classA'}]);
                    expect(ontologyStateSvc.listItem.derivedConcepts).toContain('class-iri');
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('class-iri', ['classA']);
                    expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('class-iri');
                    expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
                });
                it('without a derived concept', function() {
                    this.controller.create();
                    expect(ontoUtils.addLanguageToNewEntity).toHaveBeenCalledWith(this.controller.clazz, this.controller.language);
                    expect(ontologyStateSvc.addEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz);
                    expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
                    expect(ontologyStateSvc.addToClassIRIs).toHaveBeenCalledWith(ontologyStateSvc.listItem, this.controller.clazz['@id']);
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.controller.clazz);
                    expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(_.get(this.controller.clazz, prefixes.rdfs + 'subClassOf')).toEqual([{'@id': 'classA'}]);
                    expect(ontologyStateSvc.listItem.derivedConcepts).toEqual([]);
                    expect(ontoUtils.setSuperClasses).toHaveBeenCalledWith('class-iri', ['classA']);
                    expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('class-iri');
                    expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
                });
            });
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
