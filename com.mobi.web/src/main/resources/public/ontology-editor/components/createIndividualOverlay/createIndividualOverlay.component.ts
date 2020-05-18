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

const template = require('./createIndividualOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:createIndividualOverlay
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 * @requires ontology-editor.service:ontologyUtilsManagerService
 *
 * @description
 * `createIndividualOverlay` is a component that creates content for a modal that creates an individual in the
 * current {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains
 * a text input for the individual name (which populates the {@link ontology-editor.component:staticIri IRI}) and
 * a {@link ontology-editor.component:ontologyClassSelect} for the classes this individual will be an
 * instance of. Meant to be used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const createIndividualOverlayComponent = {
    template,
        bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: createIndividualOverlayComponentCtrl
};

createIndividualOverlayComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

function createIndividualOverlayComponentCtrl($filter, ontologyStateService, prefixes, ontologyUtilsManagerService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.prefix = dvm.os.getDefaultPrefix();

    dvm.individual = {
        '@id': dvm.prefix,
        '@type': []
    };

    dvm.nameChanged = function() {
        if (!dvm.iriHasChanged) {
            dvm.individual['@id'] = dvm.prefix + $filter('camelCase')(dvm.name, 'class');
        }
    }
    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
        dvm.iriHasChanged = true;
        dvm.individual['@id'] = iriBegin + iriThen + iriEnd;
        dvm.os.setCommonIriParts(iriBegin, iriThen);
    }
    dvm.create = function() {
        // add the entity to the ontology
        dvm.individual['@type'].push(prefixes.owl + 'NamedIndividual');
        dvm.os.addEntity(dvm.individual);
        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.individual);
        // update relevant lists
        dvm.ontoUtils.addIndividual(dvm.individual);
        // add to concept hierarchy if an instance of a derived concept
        if (dvm.ontoUtils.containsDerivedConcept(dvm.individual['@type'])) {
            dvm.ontoUtils.addConcept(dvm.individual);
        } else if (dvm.ontoUtils.containsDerivedConceptScheme(dvm.individual['@type'])) {
            dvm.ontoUtils.addConceptScheme(dvm.individual);
        }
        // Save the changes to the ontology
        dvm.ontoUtils.saveCurrentChanges();
        // Open snackbar
        dvm.os.listItem.goTo.entityIRI = dvm.individual['@id'];
        dvm.os.listItem.goTo.active = true;
        // hide the overlay
        dvm.close();
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default createIndividualOverlayComponent;