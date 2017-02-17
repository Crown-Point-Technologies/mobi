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
describe('Prop Preview directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyManagerSvc,
        mapperStateSvc,
        mappingManagerSvc,
        utilSvc,
        prefixes,
        splitIRIFilter;

    beforeEach(function() {
        module('templates');
        module('propPreview');
        injectSplitIRIFilter();
        mockOntologyManager();
        mockMapperState();
        mockMappingManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_, _mappingManagerService_, _utilService_, _prefixes_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
        });

        scope.propObj = {};
        scope.ontologies = [];
        element = $compile(angular.element('<prop-preview prop-obj="propObj" ontologies="ontologies"></prop-preview>'))(scope);
        scope.$digest();
        controller = element.controller('propPreview');
    });

    describe('controller bound variable', function() {
        it('propObj should be one way bound', function() {
            controller.propObj = {'@id': ''};
            scope.$digest();
            expect(scope.propObj).toEqual({});
        });
        it('ontologies should be one way bound', function() {
            controller.ontologies = [{}];
            scope.$digest();
            expect(scope.ontologies).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should get the name of the range of the property', function() {
            beforeEach(function() {
                utilSvc.getPropertyId.calls.reset();
                ontologyManagerSvc.getEntityName.calls.reset();
                splitIRIFilter.calls.reset();
            })
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                expect(_.isString(controller.getPropRangeName())).toBe(true);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(controller.rangeClass);
                expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
                expect(splitIRIFilter).not.toHaveBeenCalled();
            });
            it('if it is a data property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                expect(_.isString(controller.getPropRangeName())).toBe(true);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.propObj, prefixes.rdfs + 'range');
                expect(splitIRIFilter).toHaveBeenCalledWith(jasmine.any(String));
            });
        });
    });
    describe('should set the range class when the propObj changes', function() {
        beforeEach(function() {
            scope.propObj = {'@id': 'prop'};
        })
        it('unless it is a data property', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            scope.$digest();
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
            expect(controller.rangeClass).toBeUndefined();
        });
        describe('if it is a object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                utilSvc.getPropertyId.and.returnValue('class');
                this.classObj = {'@id': 'class'};
            });
            it('unless the range class is the same', function() {
                controller.rangeClass = this.classObj;
                scope.$digest();
                expect(controller.rangeClass).toEqual(this.classObj);
            });
            describe('and the range class changed', function() {
                it('to an available class', function() {
                    mapperStateSvc.availableClasses = [{classObj: this.classObj}];
                    scope.$digest();
                    expect(controller.rangeClass).toEqual(this.classObj);
                    expect(mappingManagerSvc.findSourceOntologyWithClass).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
                });
                it('to an unavailable class', function() {
                    ontologyManagerSvc.getEntity.and.returnValue(this.classObj);
                    mappingManagerSvc.findSourceOntologyWithClass.and.returnValue({entities: []});
                    scope.$digest();
                    expect(controller.rangeClass).toEqual(this.classObj);
                    expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith('class', mapperStateSvc.sourceOntologies);
                    expect(ontologyManagerSvc.getEntity).toHaveBeenCalledWith(jasmine.any(Array), 'class');
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('prop-preview')).toBe(true);
        });
        it('depending on whether the property has a description', function() {
            controller = element.controller('propPreview');
            var description = angular.element(element.querySelectorAll('.description')[0]);
            expect(description.text()).toContain('(None Specified)');

            ontologyManagerSvc.getEntityDescription.and.returnValue('Test');
            scope.$digest();
            expect(description.text()).not.toContain('(None Specified)');
        });
    });
});