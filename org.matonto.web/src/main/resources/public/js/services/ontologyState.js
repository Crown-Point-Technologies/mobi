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
        /**
         * @ngdoc overview
         * @name ontologyState
         */
        .module('ontologyState', [])
        /**
         * @ngdoc service
         * @name ontologyState.service:ontologyStateService
         * @requires $timeout
         * @requires $q
         * @requires $filter
         * @requires $document
         * @requires ontologyManager.service:ontologyManagerService
         * @requires updateRefs.service:updateRefsService
         * @requires stateManager.service:stateManagerService
         * @requires util.service:utilService
         * @requires catalogManager.service:catalogManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         */
        .service('ontologyStateService', ontologyStateService);

        ontologyStateService.$inject = ['$timeout', '$q', '$filter', '$document', 'ontologyManagerService', 'updateRefsService', 'stateManagerService', 'utilService', 'catalogManagerService', 'propertyManagerService', 'prefixes', 'manchesterConverterService', 'httpService', 'responseObj'];

        function ontologyStateService($timeout, $q, $filter, $document, ontologyManagerService, updateRefsService, stateManagerService, utilService, catalogManagerService, propertyManagerService, prefixes, manchesterConverterService, httpService, responseObj) {
            var self = this;
            var om = ontologyManagerService;
            var sm = stateManagerService;
            var cm = catalogManagerService;
            var ro = responseObj;
            var util = utilService;
            var mc = manchesterConverterService;
            var catalogId = '';

            var ontologyEditorTabStates = {
                project: {
                    entityIRI: '',
                    active: true
                },
                overview: {
                    active: false
                },
                classes: {
                    active: false
                },
                properties: {
                    active: false
                },
                individuals: {
                    active: false
                },
                search: {
                    active: false
                },
                savedChanges: {
                    active: false
                },
                merge: {
                    active: false
                },
                commits: {
                    active: false
                }
            };

            var vocabularyEditorTabStates = {
                project: {
                    active: true,
                    entityIRI: ''
                },
                schemes: {
                    active: false
                },
                concepts: {
                    active: false
                },
                search: {
                    active: false
                },
                savedChanges: {
                    active: false
                },
                merge: {
                    active: false
                },
                commits: {
                    active: false
                }
            };

            var ontologyListItemTemplate = {
                ontologyState: {
                    active: true,
                    upToDate: true
                },
                editorTabStates: angular.copy(ontologyEditorTabStates),
                ontologyRecord: {
                    title: '',
                    recordId: '',
                    branchId: '',
                    commitId: '',
                    type: 'ontology'
                },
                ontologyId: '',
                ontology: [],
                importedOntologies: [],
                importedOntologyIds: [],
                annotations: angular.copy(_.union(propertyManagerService.defaultAnnotations, propertyManagerService.owlAnnotations)),
                dataPropertyRange: om.defaultDatatypes,
                subClasses: [],
                subDataProperties: [],
                subObjectProperties: [],
                individuals: [],
                classHierarchy: [],
                classIndex: {},
                dataPropertyHierarchy: [],
                dataPropertyIndex: {},
                objectPropertyHierarchy: [],
                objectPropertyIndex: {},
                blankNodes: {},
                index: {},
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                flatClassHierarchy: [],
                flatDataPropertyHierarchy: [],
                flatObjectPropertyHierarchy: [],
                annotationPropertyHierarchy: [],
                annotationPropertyIndex: {},
                flatAnnotationPropertyHierarchy: [],
                classesAndIndividuals: {},
                classesWithIndividuals: [],
                individualsParentPath: [],
                iriList: [],
                selected: {}
            };
            var vocabularyListItemTemplate = {
                ontologyState: {
                    active: true,
                    upToDate: true
                },
                editorTabStates: angular.copy(vocabularyEditorTabStates),
                ontologyRecord: {
                    title: '',
                    recordId: '',
                    branchId: '',
                    commitId: '',
                    type: 'vocabulary'
                },
                ontologyId: '',
                ontology: [],
                importedOntologies: [],
                importedOntologyIds: [],
                annotations: angular.copy(_.union(propertyManagerService.defaultAnnotations, propertyManagerService.skosAnnotations, propertyManagerService.owlAnnotations)),
                derivedConcepts: [],
                derivedConceptSchemes: [],
                conceptHierarchy: [],
                conceptIndex: {},
                flatConceptHierarchy: [],
                conceptSchemeHierarchy: [],
                conceptSchemeIndex: {},
                flatConceptSchemeHierarchy: [],
                index: {},
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                iriList: [],
                selected: {}
            };
            
            var emptyInProgressCommit = {
                additions: [],
                deletions: []
            };

            /**
             * @ngdoc property
             * @name list
             * @propertyOf ontologyState.service:ontologyStateService
             * @type {Object[]}
             *
             * @description
             * `list` holds an array of ontology objects which contain properties associated with the ontology.
             * The structure of the ontology object is:
             * ```
             * {
             *      ontologyId: '',
             *      ontology: [],
             *      importedOntologies: [],
             *      importedOntologyIds: [],
             *      annotations: [],
             *      subDataProperties: [],
             *      subObjectProperties: [],
             *      dataPropertyRange: [],
             *      classHierarchy: [],
             *      individuals: [],
             *      classesWithIndividuals: [],
             *      subClasses: [],
             *      blankNodes: {},
             *      index: {}
             * }
             * ```
             */
            self.list = [];

            self.listItem = {};

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Initializes the `catalogId` variable.
             */
            self.initialize = function() {
                catalogId = _.get(cm.localCatalog, '@id', '');
            }
            self.reset = function() {
                self.list = [];
                self.listItem = {selected: {}};
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Retrieves the last visible state of the ontology for the current user in the provided RDF format. If
             * the user has not opened the ontology yet or the branch they were viewing no longer exists, retrieves
             * the latest state of the ontology.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the ontology id, record id, branch id, commit id,
             *                    inProgressCommit, and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(recordId, rdfFormat = 'jsonld') {
                var state = sm.getOntologyStateByRecordId(recordId);
                var deferred = $q.defer();
                if (!_.isEmpty(state)) {
                    var inProgressCommit = emptyInProgressCommit;
                    var branchId = _.get(state, "model[0]['" + prefixes.ontologyState + "branch'][0]['@id']");
                    var commitId = _.get(state, "model[0]['" + prefixes.ontologyState + "commit'][0]['@id']");
                    cm.getInProgressCommit(recordId, catalogId)
                        .then(response => {
                            inProgressCommit = response;
                            return om.getOntology(recordId, branchId, commitId, rdfFormat);
                        }, errorMessage => {
                            if (errorMessage === 'InProgressCommit could not be found') {
                                return om.getOntology(recordId, branchId, commitId, rdfFormat);
                            }
                            return $q.reject();
                        })
                        .then(ontology => deferred.resolve({ontology, recordId, branchId, commitId, inProgressCommit}), () => {
                            sm.deleteOntologyState(recordId, branchId, commitId)
                                .then(() => self.getLatestOntology(recordId, rdfFormat), $q.reject)
                                .then(deferred.resolve, deferred.reject);
                        });
                } else {
                    self.getLatestOntology(recordId, rdfFormat).then(deferred.resolve, deferred.reject);
                }
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getLatestOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Retrieves the latest state of an ontology, being the head commit of the master branch, and returns
             * a promise containing the ontology id, record id, branch id, commit id, inProgressCommit, and
             * serialized ontology.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} rdfFormat The format string to identify the serialization requested.
             * @return {Promise} A promise containing the ontology id, record id, branch id, commit id,
             *                    inProgressCommit, and JSON-LD serialization of the ontology.
             */
            self.getLatestOntology = function(recordId, rdfFormat = 'jsonld') {
                var branchId, commitId;
                return cm.getRecordMasterBranch(recordId, catalogId)
                    .then(masterBranch => {
                        branchId = _.get(masterBranch, '@id', '');
                        return cm.getRecordBranch(branchId, recordId, catalogId);
                    }, $q.reject)
                    .then(branch => {
                        commitId = _.get(branch, "['" + prefixes.catalog + "head'][0]['@id']", '');
                        return sm.createOntologyState(recordId, branchId, commitId);
                    }, $q.reject)
                    .then(() => om.getOntology(recordId, branchId, commitId, rdfFormat), $q.reject)
                    .then(ontology => {return {ontology, recordId, branchId, commitId, inProgressCommit: emptyInProgressCommit}}, $q.reject);
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided JSON-LD as a new ontology and creates a new list item for the new ontology.
             * Returns a promise with the entityIRI and ontologyId for the state of the newly created ontology.
             *
             * @param {string} ontologyJson The JSON-LD representing the ontology.
             * @param {string} title The title for the OntologyRecord.
             * @param {string} description The description for the OntologyRecord.
             * @param {string} keywords The keywords for the OntologyRecord.
             * @param {string} type The type (either "ontology" or "vocabulary") for the document being created.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * ontology.
             */
            self.createOntology = function(ontologyJson, title, description, keywords, type = 'ontology') {
                var listItem;
                return om.uploadJson(ontologyJson, title, description, keywords)
                    .then(data => {
                        listItem = setupListItem(data.ontologyId, data.recordId, data.branchId, data.commitId, [ontologyJson], emptyInProgressCommit, true, type, title);
                        return cm.getRecordBranch(data.branchId, data.recordId, catalogId);
                    }, $q.reject)
                    .then(branch => {
                        listItem.branches = [branch];
                        self.list.push(listItem);
                        self.listItem = listItem
                        self.setSelected(self.getActiveEntityIRI(), self.getActiveKey() === 'project' ? false : getUsages);
                        return {
                            entityIRI: ontologyJson['@id'],
                            recordId: listItem.ontologyRecord.recordId,
                            branchId: listItem.ontologyRecord.branchId,
                            commitId: listItem.ontologyRecord.commitId
                        };
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name uploadThenGet
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided file as an ontology and creates a new list item for the new ontology. Returns a
             * promise with the record id of the new OntologyRecord.
             *
             * @param {File} file The ontology file.
             * @param {string} title The record title.
             * @param {string} description The record description.
             * @param {string} keywords The record list of keywords separated by commas.
             * @param {string} type The type identifier for the file uploaded.
             * @returns {Promise} A promise with the ontology record ID or error message.
             */
            self.uploadThenGet = function(file, title, description, keywords, type = 'ontology') {
                var recordId, ontologyId;
                return om.uploadFile(file, title, description, keywords)
                    .then(data => {
                        recordId = data.recordId;
                        ontologyId = data.ontologyId;
                        return self.getOntology(recordId);
                    }, $q.reject)
                    .then(response => {
                        if (type === 'ontology') {
                            return self.addOntologyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit, title);
                        } else if (type === 'vocabulary') {
                            return self.addVocabularyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit, title);
                        }
                    }, $q.reject)
                    .then(response => { 
                        self.listItem = response;
                        self.setSelected(self.getActiveEntityIRI(), false);
                        return recordId; 
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name uploadChanges
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided file as an ontology and uses it as a basis for updating the existing ontology .
             *
             * @param {File} file The updated ontology file.
             * @param {string} the ontology record ID.
             * @param {string} the ontology branch ID.
             * @param {string} the ontology commit ID.
             */
            self.uploadChanges = function(file, recordId, branchId, commitId) {
                return om.uploadChangesFile(file, recordId, branchId, commitId)
                    .then(() => cm.getInProgressCommit(recordId, catalogId), $q.reject)
                    .then(commit => {
                        var listItem = self.getListItemByRecordId(recordId);
                        return self.updateOntology(recordId, branchId, commitId, listItem.ontologyRecord.type, listItem.ontologyState.upToDate, commit);
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name updateOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to update an ontology that is already open within the Ontology Editor. It will replace the existing
             * listItem with a new listItem consisting of the data associated with the record ID, branch ID, and commit
             * ID provided. Returns a promise.
             *
             * @param {string} recordId The record ID associated with the requested ontology.
             * @param {string} branchId The branch ID associated with the requested ontology.
             * @param {string} commitId The commit ID associated with the requested ontology.
             * @param {string} [type='ontology'] The type of listItem that needs to be updated.
             * @param {boolean} [upToDate=true] The flag indicating whether the ontology is upToDate or not.
             * @param {boolean} [inProgressCommit=emptyInProgressCommit] The Object containing the saved changes to apply.
             * @returns {Promise} A promise indicating the success or failure of the update.
             */
            self.updateOntology = function(recordId, branchId, commitId, type = 'ontology', upToDate = true, inProgressCommit = emptyInProgressCommit) {
                var listItem;
                var oldListItem = self.getListItemByRecordId(recordId);
                
                return om.getOntology(recordId, branchId, commitId)
                    .then(ontology => {
                        var ontologyId = om.getOntologyIRI(ontology);
                        if (type === 'ontology') {
                            return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, oldListItem.ontologyRecord.title);
                        } else if (type === 'vocabulary') {
                            return self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, oldListItem.ontologyRecord.title);
                        }
                    }, $q.reject)
                    .then(response => {
                        listItem = response;
                        listItem.editorTabStates = oldListItem.editorTabStates;
                        if (listItem.ontologyId !== oldListItem.ontologyId) {
                            self.setSelected(listItem.ontologyId, true, listItem);
                            self.resetStateTabs(listItem);
                        } else {
                            listItem.selected = oldListItem.selected;
                        }
                        return sm.updateOntologyState(recordId, branchId, commitId);
                    }, $q.reject)
                    .then(() => {
                        var activeKey = self.getActiveKey(oldListItem);
                        _.assign(oldListItem, listItem);
                        self.setActivePage(activeKey, oldListItem);
                    }, $q.reject);
            }
            self.addOntologyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, upToDate = true) {
                return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title)
                    .then(listItem => { 
                        self.list.push(listItem); 
                        return listItem; 
                    }, $q.reject);
            }
            self.addVocabularyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, upToDate = true) {
                return self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title)
                    .then(listItem => { 
                        self.list.push(listItem); 
                        return listItem; 
                    }, $q.reject);
            }
            self.createOntologyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true, title) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, 'ontology', title);
                $q.all([
                    om.getIris(recordId, branchId, commitId),
                    om.getImportedIris(recordId, branchId, commitId),
                    om.getClassHierarchies(recordId, branchId, commitId),
                    om.getClassesWithIndividuals(recordId, branchId, commitId),
                    om.getDataPropertyHierarchies(recordId, branchId, commitId),
                    om.getObjectPropertyHierarchies(recordId, branchId, commitId),
                    cm.getRecordBranches(recordId, catalogId),
                    om.getAnnotationPropertyHierarchies(recordId, branchId, commitId),
                    om.getImportedOntologies(recordId, branchId, commitId)
                ]).then(response => {
                    listItem.iriList.push(listItem.ontologyId);
                    listItem.iriList = _.union(listItem.iriList, _.map(_.flatten(_.values(response[0])), ro.getItemIri))
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        propertyManagerService.owlAnnotations,
                        _.isMatch
                    );
                    listItem.subClasses = _.get(response[0], 'classes');
                    listItem.subDataProperties = _.get(response[0], 'dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'objectProperties');
                    listItem.individuals = _.get(response[0], 'namedIndividuals');
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'datatypes'),
                        om.defaultDatatypes,
                        _.isMatch
                    );
                    _.forEach(response[1], iriList => {
                        listItem.annotations = _.unionWith(
                            addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                            listItem.annotations,
                            compareListItems
                        );
                        listItem.subClasses = _.unionWith(
                            addOntologyIdToArray(iriList.classes, iriList.id),
                            listItem.subClasses,
                            compareListItems
                        );
                        listItem.subDataProperties = _.unionWith(
                            addOntologyIdToArray(iriList.dataProperties, iriList.id),
                            listItem.subDataProperties,
                            compareListItems
                        );
                        listItem.subObjectProperties = _.unionWith(
                            addOntologyIdToArray(iriList.objectProperties, iriList.id),
                            listItem.subObjectProperties,
                            compareListItems
                        );
                        listItem.individuals = _.unionWith(
                            addOntologyIdToArray(iriList.namedIndividuals, iriList.id),
                            listItem.individuals,
                            compareListItems
                        );
                        listItem.dataPropertyRange = _.unionWith(
                            addOntologyIdToArray(iriList.datatypes, iriList.id),
                            listItem.dataPropertyRange,
                            compareListItems
                        );
                        listItem.iriList.push(iriList['id'])
                        listItem.iriList = _.union(listItem.iriList, _.map(_.flatten(_.values(iriList)), ro.getItemIri))
                    });

                    listItem.classHierarchy = response[2].hierarchy;
                    listItem.classIndex = response[2].index;
                    listItem.flatClassHierarchy = self.flattenHierarchy(listItem.classHierarchy, recordId, listItem);
                    listItem.dataPropertyHierarchy = response[4].hierarchy;
                    listItem.dataPropertyIndex = response[4].index;
                    listItem.flatDataPropertyHierarchy = self.flattenHierarchy(listItem.dataPropertyHierarchy, recordId, listItem);
                    listItem.objectPropertyHierarchy = response[5].hierarchy;
                    listItem.objectPropertyIndex = response[5].index;
                    listItem.flatObjectPropertyHierarchy = self.flattenHierarchy(listItem.objectPropertyHierarchy, recordId, listItem);
                    listItem.branches = response[6].data;
                    listItem.annotationPropertyHierarchy = response[7].hierarchy;
                    listItem.annotationPropertyIndex = response[7].index;
                    listItem.flatAnnotationPropertyHierarchy = self.flattenHierarchy(listItem.annotationPropertyHierarchy, recordId, listItem);
                    _.forEach(response[8], importedOntObj => {
                        addImportedOntologyToListItem(listItem, importedOntObj, 'ontology');
                    });
                    listItem.classesAndIndividuals = response[3].individuals;
                    listItem.classesWithIndividuals = _.keys(response[3].individuals);
                    listItem.individualsParentPath = self.getIndividualsParentPath(listItem);
                    listItem.flatIndividualsHierarchy = self.createFlatIndividualTree(listItem);
                    listItem.flatEverythingTree = self.createFlatEverythingTree(getOntologiesArrayByListItem(listItem), listItem);
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(om.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, error => _.has(error, 'statusText') ? util.onError(response, deferred) : deferred.reject(error));
                return deferred.promise;
            }
            self.getIndividualsParentPath = function(listItem) {
                var result = [];
                _.forEach(_.keys(listItem.classesAndIndividuals), classIRI => {
                    result = _.concat(result, getClassesForIndividuals(listItem.classIndex, classIRI));
                });
                return _.uniq(result);
            }
            self.createVocabularyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate = true, title) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, 'vocabulary', title);
                $q.all([
                    om.getIris(recordId, branchId, commitId),
                    om.getImportedIris(recordId, branchId, commitId),
                    om.getConceptHierarchies(recordId, branchId, commitId),
                    om.getConceptSchemeHierarchies(recordId, branchId, commitId),
                    cm.getRecordBranches(recordId, catalogId),
                    om.getImportedOntologies(recordId, branchId, commitId)
                ]).then(response => {
                    listItem.iriList.push(listItem.ontologyId);
                    listItem.iriList = _.union(listItem.iriList, _.map(_.flatten(_.values(response[0])), ro.getItemIri));
                    listItem.subDataProperties = _.get(response[0], 'dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'objectProperties');
                    listItem.derivedConcepts = _.map(_.get(response[0], 'derivedConcepts', []), ro.getItemIri);
                    listItem.derivedConceptSchemes = _.map(_.get(response[0], 'derivedConceptSchemes', []), ro.getItemIri);
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        propertyManagerService.skosAnnotations,
                        propertyManagerService.owlAnnotations,
                        _.isMatch
                    );
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'datatypes'),
                        om.defaultDatatypes,
                        _.isMatch
                    );
                    _.forEach(response[1], iriList => {
                        listItem.annotations = _.unionWith(
                            addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                            listItem.annotations,
                            compareListItems
                        );
                        listItem.subDataProperties = _.unionWith(
                            addOntologyIdToArray(iriList.dataProperties, iriList.id),
                            listItem.subDataProperties,
                            compareListItems
                        );
                        listItem.subObjectProperties = _.unionWith(
                            addOntologyIdToArray(iriList.objectProperties, iriList.id),
                            listItem.subObjectProperties,
                            compareListItems
                        );
                        listItem.iriList.push(iriList['id']);
                        listItem.iriList = _.union(listItem.iriList, _.map(_.flatten(_.values(iriList)), ro.getItemIri))
                    });
                    listItem.conceptHierarchy = response[2].hierarchy;
                    listItem.conceptIndex = response[2].index;
                    listItem.flatConceptHierarchy = self.flattenHierarchy(listItem.conceptHierarchy, recordId, listItem);
                    listItem.conceptSchemeHierarchy = response[3].hierarchy;
                    listItem.conceptSchemeIndex = response[3].index;
                    listItem.flatConceptSchemeHierarchy = self.flattenHierarchy(listItem.conceptSchemeHierarchy, recordId, listItem);
                    listItem.branches = response[4].data;
                    _.forEach(response[5], importedOntObj => {
                        addImportedOntologyToListItem(listItem, importedOntObj, 'vocabulary');
                    });
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(om.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties,
                            angular.copy(om.conceptRelationshipList), angular.copy(om.schemeRelationshipList)),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, error => _.has(error, 'statusText') ? util.onError(response, deferred) : deferred.reject(error));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name flattenHierarchy
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Flattens the provided hierarchy into an array that represents the hierarchical structure to be used
             * with a virtual scrolling solution.
             *
             * @param {Object} hierarchy The Object set up in a hierarchical structure.
             * @param {string} recordId The record ID associated with the provided hierarchy.
             * @param {Object} [listItem=self.listItem] The listItem associated with the provided hierarchy.
             * @returns {Object[]} An array which represents the provided hierarchy.
             */
            self.flattenHierarchy = function(hierarchy, recordId, listItem = self.listItem) {
                var result = [];
                var sortedHierarchy = orderHierarchy(hierarchy, listItem);
                _.forEach(sortedHierarchy, node => {
                    addNodeToResult(node, result, 0, [recordId]);
                });
                return result;
            }
            /**
             * @ngdoc method
             * @name createFlatEverythingTree
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Creates an array which represents the hierarchical structure of the relationship between classes
             * and properties to be used with a virtual scrolling solution.
             *
             * @param {Object[]} ontologies The array of ontologies to build the hierarchal structure for.
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @returns {Object[]} An array which contains the class-property replationships.
             */
            self.createFlatEverythingTree = function(ontologies, listItem) {
                var result = [];
                var orderedClasses = sortByName(om.getClasses(ontologies), listItem);
                var orderedProperties = [];
                var path = [];

                _.forEach(orderedClasses, clazz => {
                    orderedProperties = sortByName(om.getClassProperties(ontologies, clazz['@id']), listItem);
                    path = [listItem.ontologyRecord.recordId, clazz['@id']];
                    result.push(_.merge({}, clazz, {
                        indent: 0,
                        hasChildren: !!orderedProperties.length,
                        path
                    }));
                    _.forEach(orderedProperties, property => {
                        result.push(_.merge({}, property, {
                            indent: 1,
                            hasChildren: false,
                            path: _.concat(path, property['@id'])
                        }));
                    });
                });
                var orderedNoDomainProperties = sortByName(om.getNoDomainProperties(ontologies), listItem);
                if (orderedNoDomainProperties.length) {
                    result.push({
                        title: 'Properties',
                        get: self.getNoDomainsOpened,
                        set: self.setNoDomainsOpened
                    });
                    _.forEach(orderedNoDomainProperties, property => {
                        result.push(_.merge({}, property, {
                            indent: 1,
                            hasChildren: false,
                            get: self.getNoDomainsOpened,
                            path: [listItem.ontologyRecord.recordId, property['@id']]
                        }));
                    });
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name createFlatIndividualTree
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Creates an array which represents the hierarchical structure of the relationship between classes
             * and individuals to be used with a virtual scrolling solution.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @returns {Object[]} An array which contains the class-individuals replationships.
             */
            self.createFlatIndividualTree = function(listItem) {
                var result = [];
                var neededClasses = _.get(listItem, 'individualsParentPath', []);
                var classesWithIndividuals = _.get(listItem, 'classesAndIndividuals', {});
                if (neededClasses.length && !_.isEmpty(classesWithIndividuals)) {
                    _.forEach(_.get(listItem, 'flatClassHierarchy', []), node => {
                        if (_.includes(neededClasses, node.entityIRI)) {
                            result.push(_.merge({}, node, {isClass: true}));
                            var sortedIndividuals = _.sortBy(_.get(classesWithIndividuals, node.entityIRI), entityIRI => _.lowerCase(self.getEntityNameByIndex(entityIRI, listItem)));
                            _.forEach(sortedIndividuals, entityIRI => {
                                addNodeToResult({entityIRI}, result, node.indent + 1, node.path);
                            });
                        }
                    });
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
             * MatOnto repository. Adds the new entity to the index.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @param {string} entityJSON The JSON-LD representation for the entity you want to add to the ontology.
             */
            self.addEntity = function(listItem, entityJSON) {
                listItem.ontology.push(entityJSON);
                listItem.iriList.push(entityJSON['@id']);
                _.get(listItem, 'index', {})[entityJSON['@id']] = {
                    position: listItem.ontology.length - 1,
                    label: om.getEntityName(entityJSON, listItem.ontologyRecord.type),
                    ontologyIri: listItem.ontologyId
                }
            }
            /**
             * @ngdoc method
             * @name removeEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the MatOnto
             * repository. Removes the entityIRI from the index. Returns the entity Object.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to remove the entity from.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.removeEntity = function(listItem, entityIRI) {
                var entityPosition = _.get(listItem.index, "['" + entityIRI + "'].position");
                _.remove(listItem.iriList, (iri) => { return iri === entityIRI });
                _.unset(listItem.index, entityIRI);
                _.forOwn(listItem.index, (value, key) => {
                    if (value.position > entityPosition) {
                        listItem.index[key].position = value.position - 1;
                    }
                });
                return _.remove(listItem.ontology, {'@id': entityIRI})[0];
            }
            /**
             * @ngdoc method
             * @name getListItemByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the associated object from the {@link ontologyState.service:ontologyStateService#list list} that
             * contains the requested record ID. Returns the list item.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Object} The associated Object from the
             * {@link ontologyState.service:ontologyStateService#list list}.
             */
            self.getListItemByRecordId = function(recordId) {
                return _.find(self.list, {ontologyRecord: {recordId}});
            }
            /**
             * @ngdoc method
             * @name getOntologyByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the ontology from the {@link ontologyState.service:ontologyStateService#list list} using the
             * requested recordId ID. Returns the JSON-LD of the ontology.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Object[]} The JSON-LD of the requested ontology.
             */
            self.getOntologyByRecordId = function(recordId) {
                return _.get(self.getListItemByRecordId(recordId), 'ontology', []);
            }
            /**
             * @ngdoc method
             * @name getEntityByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets entity with the provided IRI from the ontology linked to the provided recordId in the MatOnto
             * repository. Returns the entity Object.
             *
             * @param {string} recordId The recordId linked to the ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntityByRecordId = function(recordId, entityIRI, listItem) {
                if (listItem) {
                    return getEntityFromListItem(listItem, entityIRI);
                }
                return getEntityFromListItem(self.getListItemByRecordId(recordId), entityIRI);
            }
            /**
             * @ngdoc method
             * @name getEntityNameByIndex
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the entity's name using the provided entityIRI and listItem to find the entity's label in the index.
             * If that entityIRI is not in the index, retrieves the beautiful IRI of the entity IRI.
             *
             * @param {Object} entity The entity you want the name of.
             * @returns {string} The beautified IRI string.
             */
            self.getEntityNameByIndex = function(entityIRI, listItem) {
                var indices = getIndices(listItem);
                var entity = _.result(_.find(indices, index => {
                    var entity = _.get(index, entityIRI);
                     return (entity !== null && _.has(entity, 'label'));
                }), entityIRI);
                return !entity ? utilService.getBeautifulIRI(entityIRI) : entity.label;
            }
            /**
             * @ngdoc method
             * @name saveChanges
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Saves all changes to the ontology with the specified record id by updating the in progress commit.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @param {Object} differenceObj The object containing statements that represent changes made.
             * @param {Object[]} differenceObj.additions The statements that were added.
             * @param {Object[]} differenceObj.deletions The statements that were deleted.
             * @returns {Promise} A promise with the ontology ID.
             */
            self.saveChanges = function(recordId, differenceObj) {
                return cm.getInProgressCommit(recordId, catalogId)
                    .then($q.when, errorMessage => {
                        if (errorMessage === 'InProgressCommit could not be found') {
                            return cm.createInProgressCommit(recordId, catalogId);
                        } else {
                            return $q.reject(errorMessage);
                        }
                    })
                    .then(() => cm.updateInProgressCommit(recordId, catalogId, differenceObj), $q.reject);
            }
            self.addToAdditions = function(recordId, json) {
                addToInProgress(recordId, json, 'additions');
            }
            self.addToDeletions = function(recordId, json) {
                addToInProgress(recordId, json, 'deletions');
            }
            /**
             * @ngdoc method
             * @name openOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to open an ontology from the MatOnto repository. It calls
             * {@link ontologyState.service:ontologyStateService#getOntology getOntology} to get the specified
             * ontology from the MatOnto repository. Returns a promise.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.openOntology = function(recordId, recordTitle, type = 'ontology') {
                var branchId, commitId, ontology, inProgressCommit, ontologyId;
                return self.getOntology(recordId)
                    .then(response => {
                        branchId = response.branchId;
                        commitId = response.commitId;
                        ontology = response.ontology;
                        inProgressCommit = response.inProgressCommit;
                        return cm.getRecordBranch(branchId, recordId, catalogId);
                    }, $q.reject)
                    .then(branch => {
                        var headId = _.get(branch, "['" + prefixes.catalog + "head'][0]['@id']", '');
                        var upToDate = headId === commitId;
                        ontologyId = om.getOntologyIRI(ontology);
                        if (type === 'ontology') {
                            return self.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordTitle, upToDate);
                        } else if (type === 'vocabulary') {
                            return self.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, recordTitle, upToDate);
                        }
                    }, $q.reject)
                    .then(response => { 
                        self.listItem = response;
                        self.setSelected(self.getActiveEntityIRI(), false);
                        return ontologyId; 
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to close an ontology from the MatOnto application. It removes the ontology list item from the
             * {@link ontologyState.service:ontologyStateService#list list}.
             *
             * @param {string} recordId The record ID of the requested ontology.
             */
            self.closeOntology = function(recordId) {
                if (self.listItem && self.listItem.ontologyRecord.recordId == recordId) {
                   self.listItem = undefined;
                }
                _.remove(self.list, { ontologyRecord: { recordId }});
            }
            self.removeBranch = function(recordId, branchId) {
                _.remove(self.getListItemByRecordId(recordId).branches, {'@id': branchId});
            }
            self.afterSave = function() {
                return cm.getInProgressCommit(self.listItem.ontologyRecord.recordId, catalogId)
                    .then(inProgressCommit => {
                        self.listItem.inProgressCommit = inProgressCommit;

                        self.listItem.additions = [];
                        self.listItem.deletions = [];

                        _.forOwn(self.listItem.editorTabStates, (value, key) => {
                            _.unset(value, 'usages');
                        });

                        if (_.isEmpty(sm.getOntologyStateByRecordId(self.listItem.ontologyRecord.recordId))) {
                            return sm.createOntologyState(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId);
                        } else {
                            return sm.updateOntologyState(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId);
                        }
                    }, $q.reject);
            }
            self.clearInProgressCommit = function() {
                _.set(self.listItem, 'inProgressCommit.additions', []);
                _.set(self.listItem, 'inProgressCommit.deletions', []);
            }
            self.setOpened = function(pathString, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(pathString, 'isOpened'), isOpened);
            }
            self.getOpened = function(pathString) {
                return _.get(self.listItem.editorTabStates, getOpenPath(pathString, 'isOpened'), false);
            }
            self.setNoDomainsOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), isOpened);
            }
            self.getNoDomainsOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), false);
            }
            self.setIndividualsOpened = function(pathString, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(pathString, 'individualsOpened'), isOpened);
            }
            self.getIndividualsOpened = function(pathString) {
                return _.get(self.listItem.editorTabStates, getOpenPath(pathString, 'individualsOpened'), false);
            }
            self.setDataPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), isOpened);
            }
            self.getDataPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), false);
            }
            self.setObjectPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), isOpened);
            }
            self.getObjectPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), false);
            }
            self.setAnnotationPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), isOpened);
            }
            self.getAnnotationPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), false);
            }
            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                var oldEntity = $filter('removeMatonto')(self.listItem.selected);
                self.getActivePage().entityIRI = newIRI;
                if (_.some(self.listItem.additions, oldEntity)) {
                    _.remove(self.listItem.additions, oldEntity);
                    updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
                } else {
                    updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
                    self.addToDeletions(self.listItem.ontologyRecord.recordId, oldEntity);
                }
                if (self.getActiveKey() !== 'project') {
                    self.setCommonIriParts(iriBegin, iriThen);
                }
                self.addToAdditions(self.listItem.ontologyRecord.recordId, $filter('removeMatonto')(self.listItem.selected));
                return om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, oldEntity['@id'], 'construct')
                    .then(statements => {
                        _.forEach(statements, statement => self.addToDeletions(self.listItem.ontologyRecord.recordId, statement));
                        updateRefsService.update(statements, oldEntity['@id'], newIRI);
                        _.forEach(statements, statement => self.addToAdditions(self.listItem.ontologyRecord.recordId, statement));
                    }, errorMessage => util.createErrorToast('Associated entities were not updated due to an internal error.'));
            }
            self.setCommonIriParts = function(iriBegin, iriThen) {
                _.set(self.listItem, 'iriBegin', iriBegin);
                _.set(self.listItem, 'iriThen', iriThen);
            }
            self.setSelected = function(entityIRI, getUsages = true, listItem = self.listItem) {
                listItem.selected = self.getEntityByRecordId(listItem.ontologyRecord.recordId, entityIRI, listItem);
                if (getUsages && !_.has(self.getActivePage(), 'usages') && listItem.selected) {
                    self.setEntityUsages(entityIRI);
                }
            }
            self.setEntityUsages = function(entityIRI) {
                var page = self.getActivePage();
                var id = 'usages-' + self.getActiveKey() + '-' + self.listItem.ontologyRecord.recordId;
                httpService.cancel(id);
                om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, entityIRI, 'select', id)
                    .then(bindings => _.set(page, 'usages', bindings),
                        response => _.set(page, 'usages', []));
            }

            self.resetStateTabs = function(listItem = self.listItem) {
                _.forOwn(listItem.editorTabStates, (value, key) => {
                    if (key !== 'project') {
                        _.unset(value, 'entityIRI');
                    } else {
                        value.entityIRI = om.getOntologyIRI(listItem.ontology);
                        value.preview = '';
                    }
                    _.unset(value, 'usages');
                });
                if (self.getActiveKey() !== 'project') {
                    listItem.selected = undefined;
                } else {
                    listItem.selected = self.getEntityByRecordId(listItem.ontologyRecord.recordId, listItem.editorTabStates.project.entityIRI);
                }
            }
            self.getActiveKey = function(listItem = self.listItem) {
                return _.findKey(listItem.editorTabStates, 'active') || 'project';
            }
            self.getActivePage = function(listItem = self.listItem) {
                return listItem.editorTabStates[self.getActiveKey(listItem)];
            }
            self.setActivePage = function(key, listItem = self.listItem) {
                if (_.has(listItem.editorTabStates, key)) {
                    self.getActivePage(listItem).active = false;
                    listItem.editorTabStates[key].active = true;
                }
            }
            self.getActiveEntityIRI = function() {
                return _.get(self.getActivePage(), 'entityIRI');
            }
            self.selectItem = function(entityIRI, getUsages = true) {
                if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
                    _.set(self.getActivePage(), 'entityIRI', entityIRI);
                    if (getUsages) {
                        self.setEntityUsages(entityIRI);
                    }
                }
                self.setSelected(entityIRI, false);
            }
            self.unSelectItem = function() {
                var activePage = self.getActivePage();
                _.unset(activePage, 'entityIRI');
                _.unset(activePage, 'usages');
                self.listItem.selected = undefined;
            }
            self.hasChanges = function(recordId) {
                var listItem = self.getListItemByRecordId(recordId);
                return !!_.get(listItem, 'additions', []).length || !!_.get(listItem, 'deletions', []).length;
            }
            self.isCommittable = function(recordId) {
                var listItem = self.getListItemByRecordId(recordId);
                return !!_.get(listItem, 'inProgressCommit.additions', []).length || !!_.get(listItem, 'inProgressCommit.deletions', []).length;
            }
            self.addEntityToHierarchy = function(hierarchy, entityIRI, indexObject, parentIRI) {
                var hierarchyItem = {entityIRI};
                var pathsToEntity = self.getPathsTo(hierarchy, indexObject, entityIRI);
                if (pathsToEntity.length) {
                    if (pathsToEntity[0].length > 1) {
                        var path = pathsToEntity[0];
                        hierarchyItem = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 0) {
                            hierarchyItem = _.find(hierarchyItem.subEntities, {entityIRI: path.shift()});
                        }
                    } else if (_.some(hierarchy, {entityIRI})) {
                        hierarchyItem = _.remove(hierarchy, hierarchyItem)[0];
                    }
                }
                if (parentIRI && self.getPathsTo(hierarchy, indexObject, parentIRI).length) {
                    _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent =>
                        parent.subEntities = _.union(_.get(parent, 'subEntities', []), [hierarchyItem]));
                    indexObject[entityIRI] = _.union(_.get(indexObject, entityIRI, []), [parentIRI]);
                } else {
                    hierarchy.push(hierarchyItem);
                }
            }
            self.deleteEntityFromParentInHierarchy = function(hierarchy, entityIRI, parentIRI, indexObject) {
                var deletedEntity;
                _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent => {
                    if (_.has(parent, 'subEntities')) {
                        deletedEntity = _.remove(parent.subEntities, {entityIRI})[0];
                        if (!parent.subEntities.length) {
                            _.unset(parent, 'subEntities');
                        }
                    }
                });
                if (_.has(indexObject, entityIRI)) {
                    _.remove(indexObject[entityIRI], item => item === parentIRI);
                    if (!indexObject[entityIRI].length) {
                        _.unset(indexObject, entityIRI);
                        hierarchy.push(deletedEntity);
                    }
                }
            }
            self.deleteEntityFromHierarchy = function(hierarchy, entityIRI, indexObject) {
                var deletedEntity;
                var paths = self.getPathsTo(hierarchy, indexObject, entityIRI);
                _.forEach(paths, path => {
                    if (path.length === 1) {
                        deletedEntity = _.remove(hierarchy, {entityIRI: path.shift()})[0];
                    } else if (path.length > 1) {
                        var current = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 1) {
                            current = _.find(current.subEntities, {entityIRI: path.shift()});
                        }
                        deletedEntity = _.remove(current.subEntities, {entityIRI: path.shift()})[0];
                        if (!current.subEntities.length) {
                            _.unset(current, 'subEntities');
                        }
                    }
                });
                _.unset(indexObject, entityIRI);
                updateRefsService.remove(indexObject, entityIRI);
                _.forEach(_.get(deletedEntity, 'subEntities', []), hierarchyItem => {
                    var paths = self.getPathsTo(hierarchy, indexObject, hierarchyItem.entityIRI);
                    if (paths.length === 0) {
                        hierarchy.push(hierarchyItem);
                        _.unset(indexObject, hierarchyItem.entityIRI);
                    }
                });
            }
            self.getPathsTo = function(hierarchy, indexObject, entityIRI) {
                var result = [];
                if (_.has(indexObject, entityIRI)) {
                    _.forEach(indexObject[entityIRI], parentIRI => {
                        var paths = self.getPathsTo(hierarchy, indexObject, parentIRI);
                        _.forEach(paths, path => {
                            path.push(entityIRI);
                            result.push(path);
                        });
                    });
                } else if (_.some(hierarchy, {entityIRI})) {
                    result.push([entityIRI]);
                }
                return result;
            }
            self.areParentsOpen = function(node, get = self.getOpened) {
                var pathString = _.first(node.path);
                var pathCopy = _.tail(_.initial(node.path));
                return _.every(pathCopy, pathPart => {
                    pathString += '.' + pathPart;
                    return get(pathString);
                });
            }
            self.joinPath = function(path) {
                return _.join(path, '.');
            }
            self.goTo = function(iri) {
                var entity = self.getEntityByRecordId(self.listItem.ontologyRecord.recordId, iri);
                if (om.isConcept(entity, self.listItem.derivedConcepts)) {
                    commonGoTo('concepts', iri, self.listItem.flatConceptHierarchy);
                } else if (om.isConceptScheme(entity, self.listItem.derivedConceptSchemes)) {
                    commonGoTo('schemes', iri, self.listItem.flatConceptSchemeHierarchy);
                } else if (om.isClass(entity)) {
                    commonGoTo('classes', iri, self.listItem.flatClassHierarchy);
                } else if (om.isDataTypeProperty(entity)) {
                    self.setDataPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.flatDataPropertyHierarchy);
                } else if (om.isObjectProperty(entity)) {
                    self.setObjectPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.flatObjectPropertyHierarchy);
                } else if (om.isAnnotation(entity)) {
                    self.setAnnotationPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.flatAnnotationPropertyHierarchy);
                } else if (om.isIndividual(entity)) {
                    commonGoTo('individuals', iri);
                } else if (om.isOntology(entity)) {
                    commonGoTo('project', iri);
                }
            }
            self.openAt = function(flatHierarchy, entityIRI) {
                var path = _.get(_.find(flatHierarchy, {entityIRI}), 'path', []);
                if (path.length) {
                    var pathString = _.head(path);
                    _.forEach(_.tail(_.initial(path)), pathPart => {
                        pathString += '.' + pathPart;
                        self.setOpened(pathString, true);
                    });
                }
            }
            self.getDefaultPrefix = function() {
                return _.replace(_.get(self.listItem, 'iriBegin', self.listItem.ontologyId), '#', '/') + _.get(self.listItem, 'iriThen', '#');
            }
            self.getOntologiesArray = function() {
                return getOntologiesArrayByListItem(self.listItem);
            }
            
            self.updatePropertyIcon = function(entity) {
                if (om.isProperty(entity)) {
                    setPropertyIcon(entity);
                }
            }

            self.hasInProgressCommit = function(listItem = self.listItem) {
                return listItem.inProgressCommit !== undefined 
                        && ((listItem.inProgressCommit.additions !== undefined && listItem.inProgressCommit.additions.length > 0) 
                        || (listItem.inProgressCommit.deletions !== undefined && listItem.inProgressCommit.deletions.length > 0));
            }

            /* Private helper functions */
            function getOntologiesArrayByListItem(listItem) {
                return _.concat([listItem.ontology], _.map(listItem.importedOntologies, 'ontology'));
            }
            function getIndices(listItem) {
                return _.concat([listItem.index], _.map(listItem.importedOntologies, 'index'));
            }
            function getEntities(hierarchy, entityIRI, indexObject) {
                var results = [];
                var pathsToEntity = self.getPathsTo(hierarchy, indexObject, entityIRI);
                _.forEach(pathsToEntity, path => {
                    var entity = _.find(hierarchy, {entityIRI: path.shift()});
                    while (path.length > 0) {
                        entity = _.find(entity.subEntities, {entityIRI: path.shift()});
                    }
                    results.push(entity);
                });
                return results;
            }
            function commonGoTo(key, iri, flatHierarchy) {
                self.setActivePage(key);
                self.selectItem(iri);
                if (flatHierarchy) {
                    self.openAt(flatHierarchy, iri);
                }
            }
            function getOpenPath() {
                return _.join(_.map([...arguments], encodeURIComponent), '.');
            }
            function setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, type, title) {
                var listItem = (type === 'ontology') ? angular.copy(ontologyListItemTemplate) : angular.copy(vocabularyListItemTemplate);
                var blankNodes = {};
                var index = {};
                _.forEach(ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        index[entity['@id']] = {
                            position: i,
                            label: om.getEntityName(entity, type),
                            ontologyIri: ontologyId
                        }
                    } else {
                        _.set(entity, 'matonto.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (om.isProperty(entity)) {
                        setPropertyIcon(entity);
                    } else if (om.isBlankNode(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, mc.jsonldToManchester(id, ontology, true));
                    } else if (om.isIndividual(entity)) {
                        findValuesMissingDatatypes(entity);
                    }
                });
                listItem.ontologyId = ontologyId;
                listItem.editorTabStates.project.entityIRI = ontologyId;
                listItem.ontologyRecord.title = title;
                listItem.ontologyRecord.recordId = recordId;
                listItem.ontologyRecord.branchId = branchId;
                listItem.ontologyRecord.commitId = commitId;
                listItem.ontologyRecord.type = type;
                listItem.ontology = ontology;
                listItem.blankNodes = blankNodes;
                listItem.index = index;
                listItem.inProgressCommit = inProgressCommit;
                return listItem;
            }
            function findValuesMissingDatatypes(object) {
                if (_.has(object, '@value')) {
                    if (!_.has(object, '@type') && !_.has(object, '@language')) {
                        object['@type'] = prefixes.xsd + "string";
                    }
                } else if (_.isObject(object)) {
                    _.forEach(_.keys(object), key => {
                        findValuesMissingDatatypes(object[key]);
                    });
                }
            }
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => _.set(item, 'ontologyId', ontologyId));
            }
            function setPropertyIcon(entity) {
                _.set(entity, 'matonto.icon', getIcon(entity));
            }
            function getIcon(property) {
                var range = _.get(property, prefixes.rdfs + 'range');
                var icon = 'fa-square-o';
                if (range) {
                    if (range.length === 1) {
                        switch(range[0]['@id']) {
                            case prefixes.xsd + 'string':
                            case prefixes.rdf + 'langString':
                                icon = 'fa-font';
                                break;
                            case prefixes.xsd + 'decimal':
                            case prefixes.xsd + 'double':
                            case prefixes.xsd + 'float':
                            case prefixes.xsd + 'int':
                            case prefixes.xsd + 'integer':
                            case prefixes.xsd + 'long':
                            case prefixes.xsd + 'nonNegativeInteger':
                                icon = 'fa-calculator';
                                break;
                            case prefixes.xsd + 'language':
                                icon = 'fa-language';
                                break;
                            case prefixes.xsd + 'anyURI':
                                icon = 'fa-external-link';
                                break;
                            case prefixes.xsd + 'dateTime':
                                icon = 'fa-clock-o';
                                break;
                            case prefixes.xsd + 'boolean':
                            case prefixes.xsd + 'byte':
                                icon = 'fa-signal';
                                break;
                            case prefixes.rdfs + 'Literal':
                                icon = 'fa-cube';
                                break;
                            default:
                                icon = 'fa-link';
                                break;
                        }
                    } else {
                        icon = 'fa-cubes';
                    }
                }
                return icon;
            }
            function getEntityFromListItem(listItem, entityIRI) {
                if  (!entityIRI || !listItem) {
                    return;
                }
                var ontology = _.get(listItem, 'ontology');
                var ontologyId = _.get(listItem, 'ontologyId');
                var importedOntologyListItems = _.get(listItem, 'importedOntologies', []);
                var importedOntologyIds = _.get(listItem, 'importedOntologyIds');
                var indices = getIndices(listItem);
                var entities = [];
                _.forEach(indices, index => {
                    var entity = _.get(index, entityIRI);
                    if (entity && _.has(entity, 'position') && _.has(entity, 'ontologyIri')) {
                        if (entity.ontologyIri === ontologyId) {
                            entities.push(ontology[entity.position]);
                        } else {
                            entities.push(importedOntologyListItems[_.indexOf(importedOntologyIds, entity.ontologyIri)].ontology[entity.position]);
                        }
                    }
                });
                var combinedEntity = _.merge.apply({}, entities);
                if (_.isEmpty(combinedEntity)) {
                    return;
                } else {
                    return combinedEntity;
                }
            }
            function addToInProgress(recordId, json, prop) {
                var listItem = self.getListItemByRecordId(recordId);
                var entity = _.find(listItem[prop], {'@id': json['@id']});
                var filteredJson = $filter('removeMatonto')(json);
                if (entity) {
                    _.mergeWith(entity, filteredJson, util.mergingArrays);
                } else  {
                    listItem[prop].push(filteredJson);
                }
            }
            function compareListItems(obj1, obj2) {
                return _.isEqual(_.get(obj1, 'localName'), _.get(obj2, 'localName'))
                    && _.isEqual(_.get(obj1, 'namespace'), _.get(obj2, 'namespace'));
            }
            function orderHierarchy(hierarchy, listItem) {
                return _.sortBy(hierarchy, node => {
                    if (_.has(node, 'subEntities')) {
                        node.subEntities = orderHierarchy(node.subEntities, listItem);
                    }
                    return _.lowerCase(self.getEntityNameByIndex(node.entityIRI, listItem));
                });
            }
            function addNodeToResult(node, result, indent, path) {
                var newPath = _.concat(path, node.entityIRI);
                var item = {
                    hasChildren: _.has(node, 'subEntities'),
                    entityIRI: node.entityIRI,
                    indent,
                    path: newPath
                };
                result.push(item);
                _.forEach(_.get(node, 'subEntities', []), subNode => {
                    addNodeToResult(subNode, result, indent + 1, newPath);
                });
            }
            function sortByName(array, listItem) {
                return _.sortBy(array, entity => _.lowerCase(self.getEntityNameByIndex(entity['@id'], listItem)));
            }
            function addImportedOntologyToListItem(listItem, importedOntObj, type) {
                var index = {};
                _.forEach(importedOntObj.ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        index[entity['@id']] = {
                            position: i,
                            label: om.getEntityName(entity, type),
                            ontologyIri: importedOntObj.id
                        }
                    }
                    self.updatePropertyIcon(entity);
                    _.set(entity, 'matonto.imported', true);
                });
                var importedOntologyListItem = {
                    id: importedOntObj.id,
                    index: index,
                    ontology: importedOntObj.ontology
                };
                listItem.importedOntologyIds.push(importedOntObj.id);
                listItem.importedOntologies.push(importedOntologyListItem);
            }
        }
        function getClassesForIndividuals(index, iri) {
            var result = [iri];
            if (_.has(index, iri)) {
                var indexCopy = angular.copy(index);
                var parentIRIs = _.get(indexCopy, iri);
                _.unset(indexCopy, iri);
                _.forEach(parentIRIs, parentIRI => {
                    result = _.concat(result, getClassesForIndividuals(indexCopy, parentIRI));
                });
            }
            return result;
        }
})();
