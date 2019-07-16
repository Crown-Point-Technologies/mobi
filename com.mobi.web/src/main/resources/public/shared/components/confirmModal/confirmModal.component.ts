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

import './confirmModal.component.scss';

const template = require('./confirmModal.component.html');

/**
 * @ngdoc component
 * @name shared.component:confirmModal
 *
 * @description
 * `confirmModal` is a component that creates content for a modal that will confirm or deny an action
 * being taken. Meant to be used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Object} resolve Information provided to the modal
 * @param {string} resolve.body An HTML string to be interpolated into the body of the modal
 * @param {Function} resolve.yes A function to be called when the modal is closed (not dismissed)
 * @param {Function} resolve.no A function to be called when the modal is dismissed (not closed)
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const confirmModalComponent = {
    template,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: confirmModalComponentCtrl
};

function confirmModalComponentCtrl() {
    var dvm = this;

    dvm.yes = function() {
        Promise.resolve(dvm.resolve.yes()).then(() => {
            dvm.close();
        });
    }
    dvm.no = function() {
        Promise.resolve(dvm.resolve.no()).then(() => dvm.dismiss());
    }
}

export default confirmModalComponent;