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
import { merge, head, filter, includes } from 'lodash';

const template = require('./newInstanceClassOverlay.component.html');

/**
 * @ngdoc component
 * @name explore.component:newInstanceClassOverlay
 * @requires shared.filter:splitIRIFilter
 * @requires uuid
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:utilService
 *
 * @description
 * `newInstanceClassOverlay` is a component that creates contents for a modal that adds an instance of a class
 * selected from the provided list to the currently
 * {@link shared.service:discoverStateService selected dataset}. The modal contains a dropdown list of
 * the classes that is searchable. For creation, an IRI is generated with a random UUID and the new instance is
 * added to the breadcrumbs to be edited.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 * @param {Object} resolve An object with data provided to the modal
 * @param {Object[]} resolve.classes The list of classes to select from
 */
const newInstanceClassOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controllerAs: 'dvm',
    controller: newInstanceClassOverlayComponentCtrl
};

newInstanceClassOverlayComponentCtrl.$inject = ['$timeout', '$filter', 'uuid', 'discoverStateService', 'exploreService', 'utilService'];

function newInstanceClassOverlayComponentCtrl($timeout, $filter, uuid, discoverStateService, exploreService, utilService) {
    var dvm = this;
    var es = exploreService;
    var util = utilService;
    dvm.ds = discoverStateService;
    dvm.searchText = '';
    dvm.selectedClass = undefined;

    dvm.$onInit = function() {
        $timeout(function() {
            var el = document.querySelector('#auto-complete');
            if ( el instanceof HTMLElement) {
                el.focus();
            }
        }, 200);
    }
    dvm.getClasses = function(searchText) {
        return searchText ? filter(dvm.resolve.classes, clazz => includes(clazz.id.toLowerCase(), searchText.toLowerCase())) : dvm.resolve.classes;
    }
    dvm.submit = function() {
        es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.selectedClass.id, {offset: 0, limit: dvm.ds.explore.instanceDetails.limit})
            .then(response => {
                dvm.ds.explore.creating = true;
                dvm.ds.explore.classId = dvm.selectedClass.id;
                dvm.ds.explore.classDeprecated = dvm.selectedClass.deprecated;
                dvm.ds.resetPagedInstanceDetails();
                merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                var iri;
                if (dvm.ds.explore.instanceDetails.data.length) {
                    var split = $filter('splitIRI')(head(dvm.ds.explore.instanceDetails.data).instanceIRI);
                    iri = split.begin + split.then + uuid.v4();
                } else {
                    var split = $filter('splitIRI')(dvm.selectedClass.id);
                    iri = 'http://mobi.com/data/' + split.end.toLowerCase() + '/' + uuid.v4();
                }
                dvm.ds.explore.instance.entity = [{
                    '@id': iri,
                    '@type': [dvm.selectedClass.id]
                }];
                dvm.ds.explore.instance.metadata.instanceIRI = iri;
                dvm.ds.explore.breadcrumbs.push(dvm.selectedClass.title);
                dvm.ds.explore.breadcrumbs.push('New Instance');
                dvm.close();
            }, util.createErrorToast);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default newInstanceClassOverlayComponent;