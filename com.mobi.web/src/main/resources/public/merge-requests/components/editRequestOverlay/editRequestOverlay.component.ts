/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import * as angular from 'angular';
import {forEach, get, reject} from 'lodash';

import './editRequestOverlay.component.scss';

const template = require('./editRequestOverlay.component.html');

/**
 * @ngdoc component
 * @name merge-requests.component:editRequestOverlay
 * @requires shared.service:mergeRequestManagerService
 * @requires shared.service:mergeRequestStateService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `editRequestOverlay` is a component that creates content for a modal that edits a merge request on the
 * {@link mergeRequestsState.service:mergeRequestsStateSvc selected entity}. Provides fields to edit Merge
 * Request title, description, target branch, assignees, and branch removal. Meant to be used in conjunction
 * with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const editRequestOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: editRequestOverlayComponentCtrl
};

editRequestOverlayComponentCtrl.$inject = ['mergeRequestsStateService', 'mergeRequestManagerService', 'catalogManagerService', 'userManagerService', 'utilService', 'prefixes'];

function editRequestOverlayComponentCtrl(mergeRequestsStateService, mergeRequestManagerService, catalogManagerService, userManagerService, utilService, prefixes) {
    var cm = catalogManagerService;
    var catalogId = get(cm.localCatalog, '@id');

    var dvm = this;
    dvm.mm = mergeRequestManagerService;
    dvm.state = mergeRequestsStateService;
    dvm.um = userManagerService;
    dvm.util = utilService;
    dvm.prefixes = prefixes;
    dvm.branches = [];
    dvm.request = {};
    dvm.errorMessage = '';

    dvm.$onInit = function() {
        initRequestConfig();

        cm.getRecordBranches(dvm.request.recordId, catalogId)
            .then(response => {
                let sourceBranchId = dvm.request.sourceBranch['@id']
                dvm.branches = reject(response.data, {'@id': sourceBranchId});
            }, error => {
                dvm.util.createErrorToast(error);
                dvm.branches = [];
            });
    }
    dvm.submit = function() {
        var jsonld = getMergeRequestJson();

        dvm.mm.updateRequest(jsonld['@id'], jsonld)
            .then(() => {
                var recordTitle = dvm.state.selected.recordTitle;
                dvm.util.createSuccessToast('Successfully updated request');
                dvm.state.selected = dvm.state.getRequestObj(jsonld);
                dvm.state.selected.recordTitle = recordTitle;
                dvm.state.setRequestDetails(dvm.state.selected);
                dvm.close();
            }, onError);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function initRequestConfig() {
        dvm.request.recordId = dvm.state.selected.recordIri;
        dvm.request.title = dvm.state.selected.title;
        dvm.request.description = dvm.util.getDctermsValue(dvm.state.selected.jsonld, 'description');
        dvm.request.sourceTitle = dvm.state.selected.sourceTitle;
        dvm.request.sourceBranch = angular.copy(dvm.state.selected.sourceBranch);
        dvm.request.targetBranch = angular.copy(dvm.state.selected.targetBranch);
        dvm.request.difference = angular.copy(dvm.state.selected.difference);
        dvm.request.assignees = [];
        dvm.request.removeSource = dvm.state.selected.removeSource;

        forEach(dvm.state.selected.jsonld[prefixes.mergereq + 'assignee'], function(user) {
            dvm.request.assignees.push(user['@id']);
        })
    }
    function getMergeRequestJson() {
        var jsonld = angular.copy(dvm.state.selected.jsonld)

        dvm.util.updateDctermsValue(jsonld, 'title', dvm.request.title);
        dvm.util.updateDctermsValue(jsonld, 'description', dvm.request.description);
        jsonld[prefixes.mergereq + 'targetBranch'] = [{'@id': dvm.request.targetBranch['@id']}];
        jsonld[prefixes.mergereq + 'assignee'] = [];
        jsonld[prefixes.mergereq + 'removeSource'] = [{'@type': prefixes.xsd + 'boolean', '@value': dvm.request.removeSource.toString()}];

        forEach(dvm.request.assignees, user => jsonld[prefixes.mergereq + 'assignee'].push({'@id': user }));

        return jsonld;
    }
    function onError(message) {
        dvm.errorMessage = message;
    }
}

export default editRequestOverlayComponent;
