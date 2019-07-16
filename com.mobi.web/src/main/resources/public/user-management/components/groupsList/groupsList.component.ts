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
import { filter } from 'lodash';

import './groupsList.component.scss';

const template = require('./groupsList.component.html');

/**
 * @ngdoc component
 * @name user-management.component:groupsList
 * @requires shared.service:userStateService
 * @requires shared.service:loginManagerService
 *
 * @description
 * `groupsList` is a component that creates an unordered list containing the provided `groups` list. The list will
 * be filtered by the provided `searchText` if present. The `selectedGroup` variable determines which group in the
 * list should be styled as if it is selected. The provided `clickEvent` function is expected to update the value of
 * `selectedGroup`.
 * 
 * @param {Object[]} groups An array of group Objects
 * @param {Object} [selectedGroup=undefined] The selected group to be styled
 * @param {Function} clickEvent A function to be called when a group is clicked. Should update the value of
 * `selectedGroup`. Expects an argument called `group`.
 * @param {string} searchText Text that should be used to filter the list of groups.
 */
const groupListComponent = {
    template,
    bindings: {
        groups: '<',
        selectedGroup: '<',
        clickEvent: '&',
        searchText: '<'
    },
    controllerAs: 'dvm',
    controller: groupListComponentCtrl
};

function groupListComponentCtrl() {
    var dvm = this;
    dvm.filteredGroups = [];

    dvm.$onInit = function() {
        dvm.filteredGroups = filterGroups();
    }
    dvm.$onChanges = function() {
        dvm.filteredGroups = filterGroups();
    }

    function filterGroups() {
        var arr = dvm.groups;
        if (dvm.searchText) {
            arr = filter(arr, group => group.title.toLowerCase().includes(dvm.searchText.toLowerCase()));
        }
        return arr.sort((group1, group2) => group1.title.localeCompare(group2.title));
    }
}

export default groupListComponent;