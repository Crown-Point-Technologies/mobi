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
describe('Modal service', function() {
    var modalSvc, $uibModal, scope, $uibModalStack;

    beforeEach(function() {
        angular.mock.module('shared');

        angular.mock.module(function($provide) {
            $provide.service('$uibModal', function($q) {
                this.open = jasmine.createSpy('open').and.returnValue({result: $q.when()});
            });
            $provide.service('$uibModalStack', function($q) {
                this.getTop = jasmine.createSpy('getTop').and.returnValue({
                    key: {
                        dismiss: $q.when()
                    },
                    value: {}
                })
            });
        });

        inject(function(modalService, _$uibModal_, _$uibModalStack_, _$rootScope_) {
            modalSvc = modalService;
            $uibModal = _$uibModal_;
            $uibModalStack = _$uibModalStack_;
            scope = _$rootScope_;
        });
    });

    afterEach(function() {
        modalSvc = null;
        $uibModal = null;
        $uibModalStack = null;
        scope = null;
    });

    describe('should open the specified modal', function() {
        it('without provided resolve values', function() {
            modalSvc.openModal('testModal');
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {}});
        });
        it('with provided resolve values', function() {
            modalSvc.openModal('testModal', {test: 'test'});
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {test: jasmine.any(Function)}});
        });
        it('with a onClose function', function() {
            var test = 'test';
            modalSvc.openModal('testModal', undefined, () => test = 'new');
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {}});
            scope.$apply();
            expect(test).toEqual('new');
        });
    });
    it('should open a confirmation modal', function() {
        modalSvc.openConfirmModal('<p>testModal</p>', _.noop, _.noop);
        expect($uibModal.open).toHaveBeenCalledWith({component: 'confirmModal', resolve: jasmine.any(Object)});
    });
});