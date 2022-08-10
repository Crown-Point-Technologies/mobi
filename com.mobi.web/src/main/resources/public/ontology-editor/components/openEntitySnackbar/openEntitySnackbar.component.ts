import { OntologyStateService } from '../../../shared/services/ontologyState.service';

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

const template = require('./openEntitySnackbar.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:openEntitySnackbar
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `openEntitySnackbar` is a component that creates a snackbar that notifies the user that the new entity was created.
 * It also provides a button that will use the {@link shared.service:ontologyStateService} to open the appropriate tab
 * and scroll to the newly created entity.
 */
const openEntitySnackbarComponent = {
    template,
    bindings: {
        iri: '<'
    },
    controllerAs: 'dvm',
    controller: openEntitySnackbarComponentCtrl
};

openEntitySnackbarComponentCtrl.$inject = ['$timeout', 'ontologyStateService'];

function openEntitySnackbarComponentCtrl($timeout, ontologyStateService: OntologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.show = false;
    dvm.entityName = '';
    dvm.hoverEdit = false;
    dvm.closeTimeout = undefined;
    dvm.resetStateTimeout = undefined;

    dvm.$onInit = function() {
        dvm.entityName = dvm.os.getEntityNameByListItem(dvm.iri);
        setShow();
    }
    dvm.$onChanges = function(changesObj) {
        if (!changesObj.iri.isFirstChange()) {
            dvm.show = false;
            $timeout.cancel(dvm.closeTimeout);
            $timeout(() => {
                dvm.entityName = dvm.os.getEntityNameByListItem(dvm.iri);
                setShow();
            }, 200);
        }
    }
    dvm.$onDestroy = function() {
        $timeout.cancel(dvm.closeTimeout);
        $timeout.cancel(dvm.resetStateTimeout);
        if (dvm.os.listItem?.goTo) {
            dvm.os.listItem.goTo.active = false;
            dvm.os.listItem.goTo.entityIRI = '';
        }
    }
    dvm.openEntity = function() {
        dvm.os.goTo(dvm.iri);
        $timeout.cancel(dvm.closeTimeout);
        closeSnackbar();
    }
    dvm.hoverIn = function() {
        dvm.hoverEdit = true;
    }
    dvm.hoverOut = function() {
        dvm.hoverEdit = false;
        closeSnackbar();
    }

    function setShow() {
        $timeout(() => {
            dvm.show = true;
            dvm.closeTimeout = $timeout(() => {
                closeSnackbar();
            }, 5500);
        }, 200)
    }
    function closeSnackbar() {
        if (!dvm.hoverEdit) {
            dvm.show = false;
            dvm.resetStateTimeout = $timeout(() => {
                if (dvm.os.listItem.goTo) {
                    dvm.os.listItem.goTo.active = false;
                    dvm.os.listItem.goTo.entityIRI = '';
                }
            }, 500);
        }
    }
}

export default openEntitySnackbarComponent;
