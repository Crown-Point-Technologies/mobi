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
import { map, without } from 'lodash';

const template = require('./createGroupOverlay.component.html');

/**
 * @ngdoc component
 * @name user-management.component:createGroupOverlay
 * @requires shared.service:userManagerService
 * @requires shared.service:userStateService
 * @requires shared.service:loginManagerService
 *
 * @description
 * `createGroupOverlay` is a component that creates content for a modal with a form to add a group to Mobi. The
 * form includes the group title, a group description, and group
 * {@link user-management.component:memberTable members}. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const createGroupOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: createGroupOverlayComponentCtrl
};

createGroupOverlayComponentCtrl.$inject = ['userManagerService', 'loginManagerService'];

function createGroupOverlayComponentCtrl(userManagerService, loginManagerService) {
    var dvm = this;
    dvm.um = userManagerService;
    dvm.lm = loginManagerService;
    dvm.newGroup = {
        title: '',
        description: '',
        roles: [],
        members: []
    };
    dvm.errorMessage = '';

    dvm.$onInit = function() {
        dvm.newGroup.members = [dvm.lm.currentUser];
    }
    dvm.getTitles = function() {
        return map(dvm.um.groups, 'title');
    }
    dvm.add = function() {
        dvm.um.addGroup(dvm.newGroup)
        .then(response => {
            dvm.errorMessage = '';
            dvm.close();
        }, error => dvm.errorMessage = error);
    }
    dvm.addMember = function(member) {
        dvm.newGroup.members = dvm.newGroup.members.concat([member]);
    }
    dvm.removeMember = function(member) {
        dvm.newGroup.members = without(dvm.newGroup.members, member);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default createGroupOverlayComponent;