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
         * @name projectTab
         *
         * @description
         * The `projectTab` module only provides the `projectTab` directive which creates a page for viewing
         * information about an ontology.
         */
        .module('projectTab', [])
        /**
         * @ngdoc directive
         * @name projectTab.directive:projectTab
         * @scope
         * @restrict E
         *
         * @description
         * `projectTab` is a directive that creates a page containing information about the current
         * {@link shared.service:ontologyStateService selected ontology}. The display includes a
         * {@link selectedDetails.directive:selectedDetails}, an
         * {@link ontology-editor.component:ontologyPropertiesBlock}, an
         * {@link ontology-editor.component:importsBlock}, and a {@link previewBlock.directive:previewBlock}. The
         * directive is replaced by the contents of its template.
         */
        .directive('projectTab', projectTab);

        projectTab.$inject = ['ontologyStateService'];

        function projectTab(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                templateUrl: 'ontology-editor/directives/projectTab/projectTab.directive.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                }
            }
        }
})();
