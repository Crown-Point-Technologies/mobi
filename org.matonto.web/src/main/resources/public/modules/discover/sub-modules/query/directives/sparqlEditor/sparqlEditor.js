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
         * @name sparqlEditor
         *
         * @description
         * The `sparqlEditor` module only provides the `sparqlEditor` directive which creates a form
         * to input a SPARQL query, its prefixes, and submit it.
         */
        .module('sparqlEditor', [])
        /**
         * @ngdoc directive
         * @name sparqlEditor.directive:sparqlEditor
         * @scope
         * @restrict E
         * @requires sparqlManager.service:sparqlManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `sparqlEditor` is a directive that creates a {@link block.directive:block block} with a form for creating
         * a {@link sparqlManager.service:sparqlManagerService#queryString SPARQL query}, selecting
         * {@link sparqlManager.service:sparqlManagerService#prefixes prefixes} and a
         * {@link sparqlManager.service:sparqlManagerService#datasetRecordIRI dataset} and submitting it. The directive
         * is replaced by the contents of its template.
         */
        .directive('sparqlEditor', sparqlEditor);

        sparqlEditor.$inject = ['sparqlManagerService', 'prefixes', 'datasetManagerService', 'utilService'];

        function sparqlEditor(sparqlManagerService, prefixes, datasetManagerService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/query/directives/sparqlEditor/sparqlEditor.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var dam = datasetManagerService;
                    dvm.util = utilService;
                    dvm.sparql = sparqlManagerService;
                    dvm.prefixList = _.sortBy(_.map(prefixes, (value, key) => key + ': <' + value + '>'));
                    dvm.editorOptions = {
                        mode: 'application/sparql-query',
                        indentUnit: 4,
                        tabMode: 'indent',
                        lineNumbers: true,
                        lineWrapping: true,
                        matchBrackets: true
                    }

                    dvm.clear = function() {
                        dvm.sparql.datasetRecordIRI = '';
                    }
                }
            }
        }
})();
