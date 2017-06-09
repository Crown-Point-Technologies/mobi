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
         * @name fileUploadPage
         *
         * @description
         * The `fileUploadPage` module only provides the `fileUploadPage` directive which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for uploading and
         * {@link previewDataGrid.directive:previewDataGrid previewing} delimited data.
         */
        .module('fileUploadPage', [])
        /**
         * @ngdoc directive
         * @name fileUploadPage.directive:fileUploadPage
         * @scope
         * @restrict E
         * @requires delimitedManager.service:delimitedManagerService
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         * @requires util.service:utilService
         *
         * @description
         * `fileUploadPage` is a directive that creates a Bootstrap `row` div with two columns containing
         * {@link block.directive:block blocks} for uploading and previewing delimited data. The left column
         * contains a block with a {@link fileUploadForm.directive:fileUploadForm file upload form} and buttons
         * to cancel the current workflow or continue. If there are invalid property mapping in the current
         * mapping, you can only continue if editing a mapping. The right column contains a
         * {@link previewDataGrid.directive:previewDataGrid preview} of the loaded delimited data. The directive
         * is replaced by the contents of its template.
         */
        .directive('fileUploadPage', fileUploadPage);

        fileUploadPage.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'utilService'];

        function fileUploadPage(mapperStateService, mappingManagerService, delimitedManagerService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/mapper/directives/fileUploadPage/fileUploadPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.util = utilService;

                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, dataMappingId);
                        var classId = dvm.mm.getClassIdByMapping(dvm.mm.findClassWithDataMapping(dvm.state.mapping.jsonld, dataMappingId));
                        return dvm.mm.getPropMappingTitle(dvm.util.getBeautifulIRI(classId), dvm.util.getBeautifulIRI(propId));
                    }
                    dvm.cancel = function() {
                    	dvm.state.displayCancelConfirm = true;
                    }
                    dvm.edit = function() {
                        dvm.state.selectedClassMappingId = _.get(dvm.mm.getBaseClass(dvm.state.mapping.jsonld), '@id', '');
                        _.forEach(dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld), classMapping => dvm.state.setAvailableProps(classMapping['@id']));
                        dvm.state.step = dvm.state.editMappingStep;
                        if (dvm.state.newMapping) {
                            dvm.state.displayMappingConfigOverlay = true;
                            dvm.state.changedMapping = true;
                        }
                    }
                }
            }
        }
})();
