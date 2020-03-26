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
import { forEach } from 'lodash';

const template = require('./createConceptOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:createConceptOverlay
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:propertyManagerService
 *
 * @description
 * `createConceptOverlay` is a component that creates content for a modal that creates a concept in the current
 * {@link shared.service:ontologyStateService selected ontology/vocabulary}. The form in the modal
 * contains a text input for the concept name (which populates the {@link ontology-editor.component:staticIri IRI}),
 * an {@link ontology-editor.component:advancedLanguageSelect}, and a `ui-select` for the concept scheme the concept
 * is "top" of. Meant to be used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const createConceptOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: createConceptOverlayComponentCtrl
};

createConceptOverlayComponentCtrl.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService', 'propertyManagerService'];

function createConceptOverlayComponentCtrl($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService, propertyManagerService) {
    var dvm = this;
    var pm = propertyManagerService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.prefixes = prefixes;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.util = utilService;
    dvm.schemeIRIs = Object.keys(dvm.os.listItem.conceptSchemes.iris);
    dvm.schemes = [];
    dvm.selectedSchemes = [];
    dvm.prefix = dvm.os.getDefaultPrefix();
    dvm.concept = {
        '@id': dvm.prefix,
        '@type': [prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept'],
        [prefixes.skos + 'prefLabel']: [{
            '@value': ''
        }]
    }

    dvm.nameChanged = function() {
        if (!dvm.iriHasChanged) {
            dvm.concept['@id'] = dvm.prefix + $filter('camelCase')(
                dvm.concept[prefixes.skos + 'prefLabel'][0]['@value'], 'class');
        }
    }
    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
        dvm.iriHasChanged = true;
        dvm.concept['@id'] = iriBegin + iriThen + iriEnd;
        dvm.os.setCommonIriParts(iriBegin, iriThen);
    }
    dvm.create = function() {
        if (dvm.selectedSchemes.length) {
            forEach(dvm.selectedSchemes, scheme => {
                var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, scheme['@id']);
                pm.addId(entity, prefixes.skos + 'hasTopConcept', dvm.concept['@id']);
                dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': scheme['@id'], [prefixes.skos + 'hasTopConcept']: [{'@id': dvm.concept['@id']}]});
                dvm.os.addEntityToHierarchy(dvm.os.listItem.conceptSchemes, dvm.concept['@id'], scheme['@id']);
            });
            dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes);
        }
        dvm.ontoUtils.addLanguageToNewEntity(dvm.concept, dvm.language);
        // add the entity to the ontology
        dvm.os.addEntity(dvm.os.listItem, dvm.concept);
        // update relevant lists
        dvm.os.listItem.concepts.iris[dvm.concept['@id']] = dvm.os.listItem.ontologyId;
        dvm.ontoUtils.addConcept(dvm.concept);
        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.concept);
        dvm.ontoUtils.addIndividual(dvm.concept);
        // Save the changes to the ontology
        dvm.ontoUtils.saveCurrentChanges();
        // Open snackbar
        dvm.os.listItem.goTo.entityIRI = dvm.concept['@id'];
        dvm.os.listItem.goTo.active = true;
        // hide the overlay
        dvm.close();
    }
    dvm.getSchemes = function(searchText) {
        dvm.schemes = dvm.ontoUtils.getSelectList(dvm.schemeIRIs, searchText);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default createConceptOverlayComponent;