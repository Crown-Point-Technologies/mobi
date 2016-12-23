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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name recordBlock
         *
         * @description
         * The `recordBlock` module only provides the `recordBlock` directive which creates
         * a div with a {@link block.directive:block block} containing all information about the
         * currently opened record in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('recordBlock', [])
        /**
         * @ngdoc directive
         * @name recordBlock.directive:recordBlock
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires utilService.service:utilService
         * @requires toastr
         *
         * @description
         * `recordBlock` is a directive which creates a div with a {@link block.directive:block block}
         * containing all information about the currently opened record in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. This record is retrieved from the
         * current catalog's opened path. Information displayed includes the
         * record's title, {@link recordTypes.directive:recordTypes types}, issued and modified
         * {@link entityDates.directive:entityDates dates},
         * {@link entityDescription.directive:entityDescription description}, and
         * {@link recordKeywords.directive:recordKeywords keywords}. If the record is a `VersionedRdfRecord`,
         * displays a paginated list of the record's branches with a
         * {@link paginationHeader.directive:paginationHeader paginationHeader} and
         * {@link catalogPagination.directive:catalogPagination catalogPagination}. Clicking a branch in the
         * list will add it to the current catalog's `openedPath`. The directive is replaced by the contents
         * of its template.
         */
        .directive('recordBlock', recordBlock);

    recordBlock.$inject = ['catalogStateService', 'catalogManagerService', 'utilService', 'toastr'];

    function recordBlock(catalogStateService, catalogManagerService, utilService, toastr) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
                dvm.util = utilService;
                dvm.record = dvm.state.getCurrentCatalog().openedPath[dvm.state.getCurrentCatalog().openedPath.length - 1];

                if (dvm.cm.isVersionedRDFRecord(dvm.record)) {
                    getBranches();
                }

                dvm.changeSort = function() {
                    if (dvm.cm.isVersionedRDFRecord(dvm.record)) {
                        getBranches();
                    }
                }
                dvm.openBranch = function(branch) {
                    dvm.state.resetPagination();
                    dvm.state.getCurrentCatalog().openedPath.push(branch);
                }

                function getBranches() {
                    dvm.state.currentPage = 0;
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    var paginatedConfig = {
                        pageIndex: dvm.state.currentPage,
                        limit: currentCatalog.branches.limit,
                        sortOption: currentCatalog.branches.sortOption,
                    }
                    dvm.cm.getRecordBranches(dvm.record['@id'], currentCatalog.catalog['@id'], paginatedConfig)
                        .then(response => dvm.state.setPagination(response), error => toastr.error(error, 'Error', {timeOut: 0}));
                }
            },
            templateUrl: 'modules/catalog/directives/recordBlock/recordBlock.html'
        };
    }
})();
