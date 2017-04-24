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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datasetsList
         *
         * @description
         * The `datasetsList` module only provides the `datasetsList` directive which creates a Bootstrap
         * row containing a block for displaying the paginated list of Dataset Records.
         */
        .module('datasetsList', [])
        /**
         * @ngdoc directive
         * @name datasetsList.directive:datasetsList
         * @scope
         * @restrict E
         * @requires datasetState.service:datasetStateService
         * @requires datasetManager.service:datasetManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `datasetsList` is a directive which creates a Bootstrap row containing a {@link block.directive:block block}
         * with a {@link pagination.directive:pagination paginated} list of
         * {@link datasetState.service:datasetStateService#results Dataset Records} and
         * {@link confirmationOverlay.directive:confirmationOverlay confirmation overlays} for deleting and clearing
         * datasets. Each dataset only displays its title, dataset IRI, and a portion of its description until it is
         * opened. Only one dataset can be open at a time. The directive is replaced by the contents of its template.
         */
        .directive('datasetsList', datasetsList);

        datasetsList.$inject = ['datasetManagerService', 'datasetStateService', 'utilService', 'prefixes'];

        function datasetsList(datasetManagerService, datasetStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/datasets/directives/datasetsList/datasetsList.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var dm = datasetManagerService;
                    dvm.state = datasetStateService;
                    dvm.util = utilService;
                    dvm.prefixes = prefixes;
                    dvm.error = '';
                    dvm.selectedDataset = undefined;
                    dvm.openedDatasetId = '';
                    dvm.showDeleteConfirm = false;
                    dvm.showClearConfirm = false;

                    dvm.clickDataset = function(dataset) {
                        if (dvm.openedDatasetId === dataset['@id']) {
                            dvm.selectedDataset = undefined;
                            dvm.openedDatasetId = '';
                        } else {
                            dvm.selectedDataset = dataset;
                            dvm.openedDatasetId = dataset['@id'];
                        }
                    }
                    dvm.getPage = function(direction) {
                        if (direction === 'prev') {
                            dvm.state.paginationConfig.pageIndex -= 1;
                            dvm.state.setResults(dvm.state.links.prev);
                        } else {
                            dvm.state.paginationConfig.pageIndex += 1;
                            dvm.state.setResults(dvm.state.links.next);
                        }
                    }
                    dvm.delete = function() {
                        dm.deleteDatasetRecord(dvm.selectedDataset['@id'])
                            .then(() => {
                                dvm.util.createSuccessToast('Dataset successfully deleted');
                                dvm.showDeleteConfirm = false;
                                dvm.error = '';
                                dvm.selectedDataset = undefined;
                                if (dvm.state.results.length === 1 && dvm.state.paginationConfig.pageIndex > 0) {
                                    dvm.state.paginationConfig.pageIndex -= 1;
                                }
                                dvm.state.setResults();
                            }, onError);
                    }
                    dvm.clear = function() {
                        dm.clearDatasetRecord(dvm.selectedDataset['@id'])
                            .then(() => {
                                dvm.util.createSuccessToast('Dataset successfully cleared');
                                dvm.showClearConfirm = false;
                                dvm.error = '';
                            }, onError);
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }
            }
        }
})();