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
        .module('createConceptSchemeOverlay', [])
        .directive('createConceptSchemeOverlay', createConceptSchemeOverlay);

        createConceptSchemeOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

        function createConceptSchemeOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createConceptSchemeOverlay/createConceptSchemeOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.util = utilService;
                    dvm.concepts = [];
                    dvm.prefix = dvm.sm.getDefaultPrefix();
                    dvm.scheme = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.scheme['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.scheme[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.scheme['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.sm.setCommonIriParts(iriBegin, iriThen);
                    }

                    dvm.create = function() {
                        _.set(dvm.scheme, 'matonto.originalIRI', dvm.scheme['@id']);
                        if (dvm.concepts.length) {
                            dvm.scheme[prefixes.skos + 'hasTopConcept'] = dvm.concepts;
                        }
                        ontoUtils.addLanguageToNewEntity(dvm.scheme, dvm.language);
                        // add the entity to the ontology
                        dvm.om.addEntity(dvm.sm.listItem, dvm.scheme);
                        // update relevant lists
                        _.get(dvm.sm.listItem, 'conceptHierarchy').push({'entityIRI': dvm.scheme['@id']});
                        _.set(_.get(dvm.sm.listItem, 'index'), dvm.scheme['@id'], dvm.sm.listItem.ontology.length - 1);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.scheme);
                        // select the new concept
                        dvm.sm.selectItem(_.get(dvm.scheme, '@id'));
                        // hide the overlay
                        dvm.sm.showCreateConceptSchemeOverlay = false;
                        ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
