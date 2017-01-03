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
describe('Record Block directive', function() {
    var $compile,
        scope,
        catalogManagerSvc,
        catalogStateSvc,
        utilSvc,
        $timeout,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('recordBlock');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _catalogStateService_, _utilService_, _$timeout_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            $timeout = _$timeout_;
            $q = _$q_;
        });

        catalogStateSvc.getCurrentCatalog.and.returnValue(catalogStateSvc.catalogs.local);
    });

    describe('should initialize', function() {
        beforeEach(function() {
            this.record = {'@id': 'record'};
            catalogStateSvc.catalogs.local.openedPath = [this.record];
        });
        it('with the correct entity for the record', function() {
            var element = $compile(angular.element('<record-block></record-block>'))(scope);
            scope.$digest();
            controller = element.controller('recordBlock');
            expect(controller.record).toEqual(this.record);
        });
        it('if the record is a VersionedRDFRecord', function() {
            catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
            var element = $compile(angular.element('<record-block></record-block>'))(scope);
            scope.$digest();
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalled();
        });
    })
    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<record-block></record-block>'))(scope);
            scope.$digest();
            controller = this.element.controller('recordBlock');
        });
        describe('should change the sort', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordBranches.calls.reset();
            });
            it('unless the record is not a VersionedRDFRecord', function() {
                catalogManagerSvc.isVersionedRDFRecord.and.returnValue(false);
                controller.changeSort();
                expect(catalogManagerSvc.getRecordBranches).not.toHaveBeenCalled();
            });
            describe('if the record is a VersionedRDFRecord', function() {
                beforeEach(function() {
                    catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
                    controller.record = {'@id': 'record'};
                    this.expectedPaginationConfig = {
                        pageIndex: 0,
                        limit: catalogStateSvc.catalogs.local.branches.limit,
                        sortOption: catalogStateSvc.catalogs.local.branches.sortOption,
                    };
                });
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordBranches.and.returnValue($q.reject('Error Message'));
                    controller.changeSort();
                    $timeout.flush();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(controller.record['@id'], catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                    expect(catalogStateSvc.currentPage).toBe(0);
                    expect(catalogStateSvc.setPagination).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
                it('succesfully', function() {
                    controller.changeSort();
                    $timeout.flush();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(controller.record['@id'], catalogStateSvc.catalogs.local['@id'], this.expectedPaginationConfig);
                    expect(catalogStateSvc.currentPage).toBe(0);
                    expect(catalogStateSvc.setPagination).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
        });
        it('should open a branch', function() {
            controller.openBranch({});
            expect(catalogStateSvc.resetPagination).toHaveBeenCalled();
            expect(catalogStateSvc.catalogs.local.openedPath).toContain({});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<record-block></record-block>'))(scope);
            scope.$digest();
            controller = this.element.controller('recordBlock');
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-block')).toBe(true);
            expect(this.element.hasClass('col-xs-12')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a catalog-breadcrumb', function() {
            expect(this.element.find('catalog-breadcrumb').length).toBe(1);
        });
        it('with an entity-title h3', function() {
            expect(this.element.querySelectorAll('h3.entity-title').length).toBe(1);
        });
        it('with a record-types', function() {
            expect(this.element.find('record-types').length).toBe(1);
        });
        it('with a entity-dates', function() {
            expect(this.element.find('entity-dates').length).toBe(1);
        });
        it('with a entity-description', function() {
            expect(this.element.find('entity-description').length).toBe(1);
        });
        it('with a record-keywords', function() {
            expect(this.element.find('record-keywords').length).toBe(1);
        });
        it('depending on whether the record is a VersionedRDFRecord', function() {
            expect(this.element.querySelectorAll('.branches-container').length).toBe(0);
            expect(this.element.find('catatlog-pagination').length).toBe(0);
            expect(this.element.find('pagination-header').length).toBe(0);

            catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.branches-container').length).toBe(1);
            expect(this.element.find('catalog-pagination').length).toBe(1);
            expect(this.element.find('pagination-header').length).toBe(1);
        });
        it('depending on how many branches the record has', function() {
            catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
            catalogStateSvc.results = [{}];
            scope.$digest();
            var branches = this.element.querySelectorAll('.branches-list button.branch');
            expect(branches.length).toBe(catalogStateSvc.results.length);
            for (var i = 0; i < branches.length; i++) {
                var branch = angular.element(branches[i]);
                expect(branch.find('entity-dates').length).toBe(1);
                expect(branch.find('entity-description').length).toBe(1);
            }
        });
    });
    it('should call openBranch when a branch button is clicked', function() {
        catalogStateSvc.results = [{}];
        var element = $compile(angular.element('<record-block></record-block>'))(scope);
        scope.$digest();
        controller = element.controller('recordBlock');
        spyOn(controller, 'openBranch');
        catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.branches-list button.branch')[0]);
        button.triggerHandler('click');
        expect(controller.openBranch).toHaveBeenCalledWith(catalogStateSvc.results[0]);
    });
});