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
(function () {
    'use strict';

    angular
        .module('editGroupInfoOverlay', [])
        .directive('editGroupInfoOverlay', editGroupInfoOverlay);

    editGroupInfoOverlay.$inject = ['userStateService', 'userManagerService'];

    function editGroupInfoOverlay(userStateService, userManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.newGroup = angular.copy(dvm.state.selectedGroup);

                dvm.set = function() {
                    dvm.um.updateGroup(dvm.state.selectedGroup.title, dvm.newGroup).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.displayEditGroupInfoOverlay = false;
                        dvm.state.selectedGroup = _.find(dvm.um.groups, {title: dvm.newGroup.title});
                    }, error => {
                        dvm.errorMessage = error;
                    });
                }
            },
            templateUrl: 'modules/user-management/directives/editGroupInfoOverlay/editGroupInfoOverlay.html'
        };
    }
})();