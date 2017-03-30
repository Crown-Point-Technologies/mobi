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
        .module('commitOverlay', [])
        .directive('commitOverlay', commitOverlay);

        commitOverlay.$inject = ['ontologyStateService', 'catalogManagerService', 'stateManagerService', 'utilService'];

        function commitOverlay(ontologyStateService, catalogManagerService, stateManagerService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/commitOverlay/commitOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var sm = stateManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var util = utilService;

                    dvm.os = ontologyStateService;
                    dvm.error = '';

                    dvm.commit = function() {
                        if (dvm.os.listItem.upToDate) {
                            createCommit(dvm.os.listItem.branchId);
                        } else {
                            var branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.branchId});
                            var branchConfig = {title: 'WIP:' +  util.getDctermsValue(branch, 'title')};
                            var description = util.getDctermsValue(branch, 'description');
                            if (description) {
                                branchConfig.description = description;
                            }
                            cm.createRecordUserBranch(dvm.os.listItem.recordId, catalogId, branchConfig,
                                dvm.os.listItem.commitId, dvm.os.listItem.branchId).then(branchId =>
                                    cm.getRecordBranch(branchId, dvm.os.listItem.recordId, catalogId)
                                        .then(branch => {
                                            dvm.os.listItem.branches.push(branch);
                                            dvm.os.listItem.branchId = branch['@id'];
                                            dvm.os.listItem.upToDate = true;
                                            createCommit(branch['@id']);
                                        }, onError), onError);
                        }
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    function createCommit(branchId) {
                        cm.createBranchCommit(branchId, dvm.os.listItem.recordId, catalogId, dvm.comment)
                            .then(commitId =>
                                sm.updateOntologyState(dvm.os.listItem.recordId, branchId, commitId)
                                    .then(() => {
                                        dvm.os.listItem.commitId = commitId;
                                        dvm.os.clearInProgressCommit();
                                        dvm.os.showCommitOverlay = false;
                                    }, onError), onError);
                    }
                }
            }
        }
})();
