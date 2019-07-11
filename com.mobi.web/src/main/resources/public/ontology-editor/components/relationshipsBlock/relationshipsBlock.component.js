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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name ontology-editor.component:relationshipsBlock
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires ontology-editor.service:ontologyUtilsManagerService
     * @requires shared.service:modalService
     * @requires shared.service:prefixes
     *
     * @description
     * `relationshipsBlock` is a component that creates a section that displays the SKOS relationships on the
     * {@link shared.service:ontologyStateService selected concept or concept scheme} using
     * {@link ontology-editor.component:propertyValues}. If the selected entity is a concept, the section header
     * contains a button to {@link ontology-editor.component:relationshipOverlay add a relationship}. If the
     * selected entity is a concept scheme, the section header contains a button to
     * {@link ontology-editor.component:topConceptOverlay add a top concept}.
     *
     * @param {Object[]} relationshipList the list of relationships to display
     */
    const relationshipsBlockComponent = {
        templateUrl: 'ontology-editor/components/relationshipsBlock/relationshipsBlock.component.html',
        bindings: {
            // relationshipList: '='
            relationshipList: '<'
        },
        controllerAs: 'dvm',
        controller: relationshipsBlockComponentCtrl
    };

    relationshipsBlockComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService', 'prefixes'];

    function relationshipsBlockComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService, prefixes) {
        var dvm = this;
        dvm.om = ontologyManagerService;
        dvm.os = ontologyStateService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.showTopConceptOverlay = false;
        dvm.showRemoveOverlay = false;

        dvm.clickPlus = function() {
            if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
                dvm.showTopConceptOverlay();
            } else {
                dvm.showRelationshipOverlay();
            }
        }
        dvm.isDisabled = function() {
            if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
                return !dvm.hasTopConceptProperty();
            } else {
                return !dvm.relationshipList.length;
            }
        }
        dvm.showRelationshipOverlay = function() {
            modalService.openModal('relationshipOverlay', {relationshipList: dvm.relationshipList}, dvm.updateHierarchy);
        }
        dvm.openRemoveOverlay = function(key, index) {
            dvm.key = key;
            modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                dvm.ontoUtils.removeProperty(key, index).then(dvm.removeFromHierarchy);
            });
        }
        dvm.updateHierarchy = function(updatedRelationshipObj) {
            dvm.ontoUtils.updateVocabularyHierarchies(updatedRelationshipObj.relationship, updatedRelationshipObj.values);
        }
        dvm.removeFromHierarchy = function(axiomObject) {
            dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
        }
        dvm.hasTopConceptProperty = function() {
            return !_.isEmpty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', dvm.os.listItem));
        }
        dvm.showTopConceptOverlay = function() {
            modalService.openModal('topConceptOverlay', {}, dvm.updateHierarchy);
        }
    }

    angular.module('ontology-editor')
        .component('relationshipsBlock', relationshipsBlockComponent);
})();
