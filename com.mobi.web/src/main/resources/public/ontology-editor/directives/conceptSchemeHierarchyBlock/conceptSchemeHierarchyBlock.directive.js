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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name conceptSchemeHierarchyBlock
         *
         * @description
         * The `conceptSchemeHierarchyBlock` module only provides the `conceptSchemeHierarchyBlock` directive which
         * creates a section for displaying the concepts and concept schemes in an ontology/vocabulary.
         */
        .module('conceptSchemeHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name conceptSchemeHierarchyBlock.directive:conceptSchemeHierarchyBlock
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         *
         * @description
         * `conceptSchemeHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the concept schemes and concepts in the current
         * {@link shared.service:ontologyStateService selected ontology/vocabulary}. The directive is replaced
         * by the contents of its template.
         */
        .directive('conceptSchemeHierarchyBlock', conceptSchemeHierarchyBlock);

        conceptSchemeHierarchyBlock.$inject = ['ontologyStateService'];

        function conceptSchemeHierarchyBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.updateSearch = function(value) {
                        dvm.os.listItem.editorTabStates.schemes.searchText = value;
                    }
                    dvm.resetIndex = function() {
                        dvm.os.listItem.editorTabStates.schemes.index = 0;
                    }
                }
            }
        }
})();