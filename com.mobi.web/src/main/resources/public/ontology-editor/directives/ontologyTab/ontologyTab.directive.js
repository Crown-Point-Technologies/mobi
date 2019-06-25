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
        .module('ontologyTab', [])
        /**
         * @ngdoc directive
         * @name ontologyTab.directive:ontologyTab
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:catalogManagerService
         * @requires shared.service:utilService
         * @requires shared.service:prefixes
         *
         * @description
         * `ontologyTab` is a directive that creates a `div` containing all the directives necessary for
         * displaying an ontology. This includes a {@link mergeTab.directive:mergeTab},
         * {@link ontologyButtonStack.directive:ontologyButtonStack}, and
         * {@link shared.component:materialTabset}. The `materialTabset` contains tabs for the
         * {@link ontology-editor.component:projectTab}, {@link ontology-editor.component:overviewTab},
         * {@link ontology-editor.component:classesTab}, {@link ontology-editor.component:propertiesTab},
         * {@link ontology-editor.component:individualsTab}, {@link ontology-editor.component:conceptSchemesTab},
         * {@link ontology-editor.component:conceptsTab}, {@link ontology-editor.component:searchTab},
         * {@link ontology-editor.component:savedChangesTab}, and {@link ontology-editor.component:commitsTab}. The
         * directive is replaced by the contents of its template.
         */
        .directive('ontologyTab', ontologyTab);

        ontologyTab.$inject = ['$q', 'ontologyStateService', 'catalogManagerService', 'utilService', 'prefixes'];

        function ontologyTab($q, ontologyStateService, catalogManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyTab/ontologyTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var util = utilService;

                    dvm.os = ontologyStateService;
                    dvm.savedChanges = '<i class="fa fa-exclamation-triangle"></i> Changes';

                    function checkBranchExists() {
                        if (dvm.os.listItem.ontologyRecord.branchId && !_.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId})) {
                            var catalogId = _.get(cm.localCatalog, '@id', '');
                            var masterBranch = _.find(dvm.os.listItem.branches, branch => util.getDctermsValue(branch, 'title') === 'MASTER')['@id'];
                            var state = dvm.os.getOntologyStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
                            var commitId = util.getPropertyId(_.find(state.model, {[prefixes.ontologyState + 'branch']: [{'@id': masterBranch}]}), prefixes.ontologyState + 'commit');
                            cm.getBranchHeadCommit(masterBranch, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                .then(headCommit => {
                                    var headCommitId = _.get(headCommit, "commit['@id']", '');
                                    if (!commitId) {
                                        commitId = headCommitId;
                                    }
                                    return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, masterBranch, commitId, commitId === headCommitId);
                                }, $q.reject)
                                .then(() => dvm.os.resetStateTabs(), util.createErrorToast);
                        }
                    }

                    checkBranchExists();
                }
            }
        }
})();
