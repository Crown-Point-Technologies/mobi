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
(function() {
    'use strict';

    angular
        .module('ontology-editor', [
            /* New Directives */
            'advancedLanguageSelect',
            'annotationBlock',
            'annotationOverlay',
            'associationBlock',
            'axiomBlock',
            'axiomOverlay',
            'branchSelect',
            'characteristicsBlock',
            'characteristicsRow',
            'classAxioms',
            'classesTab',
            'classHierarchyBlock',
            'commitOverlay',
            'commitsTab',
            'conceptHierarchyBlock',
            'conceptsTab',
            'createBranchOverlay',
            'createClassOverlay',
            'createConceptOverlay',
            'createConceptSchemeOverlay',
            'createIndividualOverlay',
            'createPropertyOverlay',
            'datatypePropertyAxioms',
            'datatypePropertyBlock',
            'datatypePropertyOverlay',
            'editBranchOverlay',
            'editorRadioButtons',
            'everythingTree',
            'hierarchyTree',
            'importsBlock',
            'importsOverlay',
            'individualsTab',
            'individualHierarchyBlock',
            'individualTree',
            'languageSelect',
            'mergeTab',
            'newOntologyTab',
            'objectPropertyAxioms',
            'objectPropertyBlock',
            'objectPropertyOverlay',
            'objectSelect',
            'ontologyButtonStack',
            'ontologyCloseOverlay',
            'ontologyDefaultTab',
            'ontologyDownloadOverlay',
            'ontologyOverlays',
            'ontologyTab',
            'ontologyEditorTabset',
            'ontologyPropertiesBlock',
            'ontologyPropertyOverlay',
            'openOntologyTab',
            'overviewTab',
            'previewBlock',
            'projectTab',
            'propertiesTab',
            'propertyValues',
            'propertyHierarchyBlock',
            'relationshipOverlay',
            'relationshipsBlock',
            'removePropertyOverlay',
            'savedChangesTab',
            'searchTab',
            'selectedDetails',
            'serializationSelect',
            'staticIri',
            'stringSelect',
            'treeItem',
            'uploadOntologyTab',
            'usagesBlock',
            'vocabularyTab',

            /* Services */
            'ontologyUtilsManager'
        ]);
})();
