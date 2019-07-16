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
    mockMappingManager,
    mockMapperState,
    mockUtil,
    mockModal
} from '../../../../../../test/js/Shared';

fdescribe('Edit Mapping Form component', function() {
    var $compile, scope, mapperStateSvc, mappingManagerSvc, utilSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('mapper');
        mockComponent('mapper', 'classMappingDetails');
        mockComponent('mapper', 'classMappingSelect');
        mockMapperState();
        mockMappingManager();
        mockUtil();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_, _mappingManagerService_, _utilService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            utilSvc = _utilService_;
            modalSvc = _modalService_;
        });

        mapperStateSvc.mapping = {name: '', jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editMappingForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        mappingManagerSvc = null;
        utilSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('EDIT-MAPPING-FORM');
            expect(this.element.querySelectorAll('.edit-mapping-form').length).toEqual(1);
            expect(this.element.querySelectorAll('.mapping-config').length).toEqual(1);
            expect(this.element.querySelectorAll('.class-mapping-select-container').length).toEqual(1);
        });
        ['class-mapping-select', 'class-mapping-details'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on whether a class has been selected', function() {
            var deleteClassButton = angular.element(this.element.querySelectorAll('.class-mapping-select-container button')[0]);
            expect(deleteClassButton.attr('disabled')).toBeTruthy();

            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(deleteClassButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether there are available classes', function() {
            var button = angular.element(this.element.querySelectorAll('.class-mappings button.add-class-mapping-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            mapperStateSvc.availableClasses = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should open the classMappingOverlay', function() {
            this.controller.openClassMappingOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('classMappingOverlay', {}, this.controller.setClassMappings);
        });
        it('should open the mappingConfigOverlay', function() {
            this.controller.openMappingConfig();
            expect(modalSvc.openModal).toHaveBeenCalledWith('mappingConfigOverlay', {}, this.controller.setClassMappings, 'lg');
        });
        it('should confirm deleting a class mapping', function() {
            this.controller.confirmDeleteClass();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), this.controller.deleteClass);
        });
        it('should delete a class mapping from the mapping', function() {
            mapperStateSvc.selectedClassMappingId = 'class';
            var classMappingId = mapperStateSvc.selectedClassMappingId;
            spyOn(this.controller, 'setClassMappings');
            this.controller.deleteClass();
            expect(mapperStateSvc.deleteClass).toHaveBeenCalledWith(classMappingId);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
            expect(this.controller.setClassMappings).toHaveBeenCalled();
        });
        it('should get the name of a mapping entity', function() {
            var id = 'id';
            mapperStateSvc.mapping.jsonld = [{'@id': id}];
            expect(_.isString(this.controller.getEntityName(id))).toBe(true);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': id}, 'title');
        });
        it('should set the class mappings of the mapping', function() {
            mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
            this.controller.setClassMappings();
            expect(mappingManagerSvc.getAllClassMappings).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
            expect(this.controller.classMappings).toEqual([{}]);
        });
    });
    it('should call openClassMappingOverlay when the add class button is linked', function() {
        spyOn(this.controller, 'openClassMappingOverlay');
        var button = angular.element(this.element.querySelectorAll('.class-mappings button.add-class-mapping-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.openClassMappingOverlay).toHaveBeenCalled();
    });
    it('should call openMappingConfig when the edit config link is clicked', function() {
        spyOn(this.controller, 'openMappingConfig');
        var button = angular.element(this.element.querySelectorAll('.mapping-config button')[0]);
        button.triggerHandler('click');
        expect(this.controller.openMappingConfig).toHaveBeenCalled();
    });
    it('should set the correct state when delete class button is clicked', function() {
        spyOn(this.controller, 'confirmDeleteClass');
        mapperStateSvc.selectedClassMappingId = 'class';
        scope.$digest();
        var button = angular.element(this.element.querySelectorAll('.class-mapping-select-container button')[0]);
        button.triggerHandler('click');
        expect(this.controller.confirmDeleteClass).toHaveBeenCalled();
    });
});
