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
         * @name superPropertySelect
         *
         * @description
         * The `superPropertySelect` module only provides the `superPropertySelect` directive which creates
         * the super property select.
         */
        .module('superPropertySelect', [])
        /**
         * @ngdoc directive
         * @name superPropertySelect.directive:superPropertySelect
         * @scope
         * @restrict E
         * @requires responseObj.service:responseObj
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents in the super property select which provides a link to show a dropdown select of
         * all available properties idetified by the provided key.
         */
        .directive('superPropertySelect', superPropertySelect);

        superPropertySelect.$inject = ['responseObj', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'prefixes'];
        function superPropertySelect(responseObj, ontologyStateService, utilService, ontologyUtilsManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/superPropertySelect/superPropertySelect.html',
                scope: {
                    key: '<'
                },
                bindToController: {
                    values: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                     dvm.ontoUtils = ontologyUtilsManagerService;
                     dvm.ro = responseObj;
                     dvm.os = ontologyStateService;
                     dvm.util = utilService;
                     dvm.isShown = false;

                    dvm.show = function() {
                        dvm.isShown = true;
                    }

                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.values = [];
                    }
                }
            }
        }
})();