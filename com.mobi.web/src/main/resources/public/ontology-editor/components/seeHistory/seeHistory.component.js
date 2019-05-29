/*-
 * #%L
 * com.mobi.web
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

    /**
     * @ngdoc component
     * @name ontology-editor.component:seeHistory
     * @requires shared.service:catalogManagerService
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:ontologyUtilsManagerService
     * @requires shared.service:utilService
     *
     * @description
     * The `seeHistory` component creates a page for viewing the addition and deletion history of commits on a
     * particular entity in an ontology. If no commitId is selected, no compiled resource will be shown.
     */
    const seeHistoryComponent = {
        templateUrl: 'ontology-editor/components/seeHistory/seeHistory.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: seeHistoryComponentCtrl
    };

    seeHistoryComponentCtrl.$inject = ['catalogManagerService', 'ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'utilService'];

    function seeHistoryComponentCtrl(catalogManagerService, ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, utilService) {
        var dvm = this;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.cm = catalogManagerService;
        dvm.os = ontologyStateService;
        dvm.om = ontologyManagerService;
        dvm.util = utilService;
        dvm.commits = [];

        dvm.goBack = function() {
            dvm.os.listItem.seeHistory = undefined;
            dvm.os.listItem.selectedCommit = undefined;
        }
        dvm.prev = function() {
            var index = _.findIndex(dvm.commits, dvm.os.listItem.selectedCommit);
            dvm.os.listItem.selectedCommit = dvm.commits[index + 1];
        }
        dvm.next = function() {
            var index = dvm.commits.indexOf(dvm.os.listItem.selectedCommit);
            dvm.os.listItem.selectedCommit = dvm.commits[index - 1];
        }
        dvm.getEntityNameDisplay = function(iri) {
            return dvm.om.isBlankNodeId(iri) ? dvm.ontoUtils.getBlankNodeValue(iri) : dvm.ontoUtils.getLabelForIRI(iri);
        }
        dvm.receiveCommits = function(commits) {
            dvm.commits = commits;
            if (dvm.commits[0]) {
                dvm.os.listItem.selectedCommit = dvm.commits[0];
            }
        }
        dvm.createLabel = function(commitId) {
            var label = dvm.util.condenseCommitId(commitId);
            if (commitId == dvm.commits[0].id) {
                label = label + ' (latest)';
            }
            return label;
        }
    }

    angular.module('ontology-editor')
        .component('seeHistory', seeHistoryComponent);
})();
