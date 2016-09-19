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
         * @name classMappingSelect
         *
         * @description 
         * The `classMappingSelect` module only provides the `classMappingSelect` directive which creates
         * a `ui-select` with all the class mappings in the current 
         * {@link mappingManager.service:mappingManagerService#mapping mapping}.
         */
        .module('classMappingSelect', [])
        /**
         * @ngdoc directive
         * @name classMappingSelect.directive:classMappingSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         *
         * @description 
         * `classMappingSelect` is a directive that creates a div with `ui-select` containing all the class 
         * mappings in the current {@link mappingManager.service:mappingManagerService#mapping mapping}. 
         * The model for the `ui-select` will be the id of the selected class mapping. The directive is 
         * replaced by the contents of its template.
         *
         * @param {Function} onChange A method to be called when the selected class mapping changes
         * @param {string} bindModel The id of the selected class mapping
         */
        .directive('classMappingSelect', classMappingSelect);

        classMappingSelect.$inject = ['mappingManagerService', 'ontologyManagerService'];

        function classMappingSelect(mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                	onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controller: function() {
                    var dvm = this;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.getClassName = function(classMapping) {
                        var classId = dvm.mm.getClassIdByMapping(classMapping);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(classId), 'entities'), classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/classMappingSelect/classMappingSelect.html'
            }
        }
})();