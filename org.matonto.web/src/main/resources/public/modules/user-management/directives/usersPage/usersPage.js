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
        /**
         * @ngdoc overview
         * @name usersPage
         *
         * @description
         * The `usersPage` module only provides the `usersPage` directive which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for selecting and editing
         * a user in the {@link userManager.service:userManagerServiec#users users list}.
         */
        .module('usersPage', [])
        /**
         * @ngdoc directive
         * @name usersPage.directive:usersPage
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         * @requires userManager.service:userManagerService
         * @requires loginManager.service:loginManagerService
         * @requires util.service:utilService
         *
         * @description
         * `usersPage` is a directive that creates a Bootstrap `row` div with three columns
         * containing {@link block.directive:block blocks} for selecting and editing a user.
         * The left column contains a {@link usersList.directive:usersList usersList} block
         * for selecting the current {@link userState.service:userStateService#selectedUser user}
         * and buttons for creating, deleting, and searching for a user. The center column contains
         * a block for previewing and editing a user's profile information and a block for changing
         * a user's password. The right column contains a block for viewing and changing a user's
         * {@link permissionsInput.directive:permissionsInput permissions} and a block for viewing
         * the groups a user is a member of. The directive is replaced by the contents of its template.
         */
        .directive('usersPage', usersPage);

    usersPage.$inject = ['userStateService', 'userManagerService', 'loginManagerService', 'utilService'];

    function usersPage(userStateService, userManagerService, loginManagerService, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;
                dvm.util = utilService;
                dvm.roles = {admin: _.includes(_.get(dvm.state.selectedUser, 'roles', []), 'admin')};

                $scope.$watch('dvm.state.selectedUser', function(newValue, oldValue) {
                    if (!_.isEqual(newValue, oldValue)) {
                        dvm.roles.admin = _.includes(_.get(dvm.state.selectedUser, 'roles', []), 'admin');
                    }
                });
                dvm.deleteUser = function() {
                    dvm.state.displayDeleteUserConfirm = true;
                }
                dvm.createUser = function() {
                    dvm.state.displayCreateUserOverlay = true;
                }
                dvm.editProfile = function() {
                    dvm.state.displayEditUserProfileOverlay = true;
                }
                dvm.resetPassword = function() {
                    dvm.state.displayResetPasswordOverlay = true;
                }
                dvm.changeRoles = function() {
                    var request = dvm.roles.admin ? dvm.um.addUserRoles(dvm.state.selectedUser.username, ['admin']) : dvm.um.deleteUserRole(dvm.state.selectedUser.username, 'admin');
                    request.then(angular.noop, dvm.util.createErrorToast);
                }
                dvm.getUserGroups = function() {
                    return _.filter(dvm.um.groups, group => _.includes(group.members, dvm.state.selectedUser.username));
                }
                dvm.goToGroup = function(group) {
                    dvm.state.showGroups = true;
                    dvm.state.showUsers = false;
                    dvm.state.selectedGroup = group;
                }
            }],
            templateUrl: 'modules/user-management/directives/usersPage/usersPage.html'
        };
    }
})();
