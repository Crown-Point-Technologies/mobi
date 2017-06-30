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
         * @name mapperState
         *
         * @description
         * The `mapperState` module only provides the `mapperStateService` service which
         * contains various variables to hold the state of the mapping tool page and
         * utility functions to update those variables.
         */
        .module('mapperState', [])
        /**
         * @ngdoc service
         * @name mapperState.service:mapperStateService
         * @requires prefixes.service:prefixes
         * @requires mappingManager.service:mappingManagerService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires delimitedManager.service:delimitedManagerService
         *
         * @description
         * `mapperStateService` is a service which contains various variables to hold the
         * state of the mapping tool page and utility functions to update those variables.
         */
        .service('mapperStateService', mapperStateService);

        mapperStateService.$inject = ['$q', 'prefixes', 'mappingManagerService', 'ontologyManagerService', 'catalogManagerService', 'delimitedManagerService', 'utilService'];

        function mapperStateService($q, prefixes, mappingManagerService, ontologyManagerService, catalogManagerService, delimitedManagerService, utilService) {
            var self = this;
            var mm = mappingManagerService,
                cm = catalogManagerService,
                om = ontologyManagerService,
                dm = delimitedManagerService,
                util = utilService;

            // Static step indexes
            self.selectMappingStep = 0;
            self.fileUploadStep = 1;
            self.editMappingStep = 2;

            /**
             * @ngdoc property
             * @name mapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object}
             *
             * @description
             * `mapping` holds the mapping object of the mapping being currently viewed/edited.
             * The structure of the object is:
             * ```
             * {
             *    id: '',
             *    jsonld: [],
             *    record: {},
             *    ontology: {},
             *    difference: {
             *      additions: [],
             *      deletions: []
             *    }
             * }
             * ```
             */
            self.mapping = undefined;

            /**
             * @ngdoc property
             * @name sourceOntologies
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object[]}
             *
             * @description
             * `sourceOntologies` holds an array of all the ontologies used for the currently selected
             * mapping. This includes the source ontology as specified by the mapping array and the
             * imports closure of that ontology.
             */
            self.sourceOntologies = [];
            /**
             * @ngdoc property
             * @name editMapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `editMapping` holds a boolean indicating whether or not the mapping page is
             * editing a mapping
             */
            self.editMapping = false;
            /**
             * @ngdoc property
             * @name newMapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `newMapping` holds a boolean indicating whether or not the mapping page is
             * creating a new mapping
             */
            self.newMapping = false;
            /**
             * @ngdoc property
             * @name step
             * @propertyOf mapperState.service:mapperStateService
             * @type {number}
             *
             * @description
             * `step` holds a number indicating what step in the mapping process the mapping
             * page is currently on
             */
            self.step = 0;
            /**
             * @ngdoc property
             * @name invalidProps
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object[]}
             *
             * @description
             * `invalidProps` holds an array of objects representing property mappings in the
             * current {@link mapperState.service:mapperStateService#mapping mapping}
             * that are mapped to non-existent column indexes in the currently loaded
             * {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}.
             * The format of the objects is:
             * ```
             * {
             *     '@id': 'propMappingId',
             *     index: 0
             * }
             * ```
             */
            self.invalidProps = [];
            /**
             * @ngdoc property
             * @name availableClasses
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object[]}
             *
             * @description
             * `availableClasses` holds an array of objects representing the classes from all source ontologies
             * that have not been used for a class mapping yet. Each object has the following structure:
             * ```
             * {
             *     ontologyId: '',
             *     classObj: {}
             * }
             * ```
             */
            self.availableClasses = [];
            /**
             * @ngdoc property
             * @name availablePropsByClass
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object}
             *
             * @description
             * `availablePropsByClass` holds a object with keys for the class mappings in the currently selected
             * {@link mapperState.service:mapperStateService#mapping mapping} and values indicating whether
             * the class mapping still has properties available to map.
             */
            self.availablePropsByClass = {};
            /**
             * @ngdoc property
             * @name invalidOntology
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `invalidOntology` holds a boolean indicating whether or not the source ontology for the
             * currently selected {@link mapperState.service:mapperStateService#mapping mapping} is
             * incompatible.
             */
            self.invalidOntology = false;
            /**
             * @ngdoc property
             * @name displayCreateMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayCreateMappingOverlay` holds a boolean indicating whether or not the
             * {@link createMappingOverlay.directive:createMappingOverlay create mapping overlay}
             * should be shown.
             */
            self.displayCreateMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayDownloadMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayDownloadMappingOverlay` holds a boolean indicating whether or not the
             * {@link downloadMappingOverlay.directive:downloadMappingOverlay download mapping overlay}
             * should be shown.
             */
            self.displayDownloadMappingOverlay = false;
            /**
             * @ngdoc method
             * @name displayRunMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {Boolean}
             *
             * @description
             * `displayRunMappingOverlay` holds a boolean indicating whether or not the
             * {@link runMappingOverlay.directive:runMappingOverlay run mapping overlay} should be shown.
             */
            self.displayRunMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayMappingConfigOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayMappingConfigOverlay` holds a boolean indicating whether or not the
             * {@link mappingConfigOverlay.directive:mappingConfigOverlay mapping configuration overlay}
             * should be shown.
             */
            self.displayMappingConfigOverlay = false;
            /**
             * @ngdoc property
             * @name displayPropMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayPropMappingOverlay` holds a boolean indicating whether or not the
             * {@link propMappingOverlay.directive:propMappingOverlay property mapping overlay}
             * should be shown.
             */
            self.displayPropMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayClassMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayClassMappingOverlay` holds a boolean indicating whether or not the
             * {@link classMappingOverlay.directive:classMappingOverlay class mapping overlay}
             * should be shown.
             */
            self.displayClassMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayDeletePropConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayDeletePropConfirm` holds a boolean indicating whether or not the delete property
             * mapping overlay should be shown.
             */
            self.displayDeletePropConfirm = false;
            /**
             * @ngdoc property
             * @name displayDeleteClassConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayDeleteClassConfirm` holds a boolean indicating whether or not the delete class
             * mapping overlay should be shown.
             */
            self.displayDeleteClassConfirm = false;
            /**
             * @ngdoc property
             * @name displayCancelConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayCancelConfirm` holds a boolean indicating whether or not the cancel confirm
             * overlay should be shown.
             */
            self.displayCancelConfirm = false;
            /**
             * @ngdoc property
             * @name displayDeleteMappingConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `displayDeleteMappingConfirm` holds a boolean indicating whether or not the delete
             * mapping confirm overlay should be shown.
             */
            self.displayDeleteMappingConfirm = false;
            /**
             * @ngdoc property
             * @name editIriTemplate
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `editIriTemplate` holds a boolean indicating whether or not the
             * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay} should be
             * shown.
             */
            self.editIriTemplate = false;
            /**
             * @ngdoc property
             * @name selectedClassMappingId
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description
             * `selectedClassMappingId` holds a string with the IRI of the currently selected
             * class mapping.
             */
            self.selectedClassMappingId = '';
            /**
             * @ngdoc property
             * @name selectedPropMappingId
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description
             * `selectedPropMappingId` holds a string with the IRI of the currently selected
             * property mapping.
             */
            self.selectedPropMappingId = '';
            /**
             * @ngdoc property
             * @name newProp
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `newProp` holds a boolean indicating whether or not the a new property is being mapped
             */
            self.newProp = false;
            /**
             * @ngdoc property
             * @name highlightIndexes
             * @propertyOf mapperState.service:mapperStateService
             * @type {string[]}
             *
             * @description
             * `highlightIndexes` holds an array of strings containing column indexes to highlight
             * in the {@link previewDataGrid.directive:previewDataGrid previewDataGrid}.
             */
            self.highlightIndexes = [];
            /**
             * @ngdoc property
             * @name highlmappingSearchStringightIndex
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description
             * `mappingSearchString` holds a string that will be used to filter the
             * {@link mappingList.directive:mappingList mapping list}.
             */
            self.mappingSearchString = '';
            /**
             * @ngdoc property
             * @name changedMapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description
             * `changedMapping` holds a boolean indicating whether or not the opened mapping has been changed.
             * If the current mapping is a new mapping, this variable should be true.
             */
            self.changedMapping = false;

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Sets the main state variables back to their default values and resets the values of
             * {@link mapperState.service:mapperStateService#mapping mapping} and
             * {@link mapperState.service:mapperStateService#sourceOntologies sourceOntologies}.
             */
            self.initialize = function() {
                self.editMapping = false;
                self.newMapping = false;
                self.step = 0;
                self.invalidProps = [];
                self.availablePropsByClass = {};
                self.availableClasses = [];
                self.mapping = undefined;
                self.sourceOntologies = [];
                self.changedMapping = false;
            }
            /**
             * @ngdoc method
             * @name resetEdit
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Sets the edit related state variables back to their default values.
             */
            self.resetEdit = function() {
                self.selectedClassMappingId = '';
                self.selectedPropMappingId = '';
                self.highlightIndexes = [];
                self.newProp = false;
            }
            /**
             * @ngdoc method
             * @name createMapping
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Sets the state variables, {@link mapperState.service:mapperStateService#mapping mapping}, and
             * {@link mapperState.service:mapperStateService#sourceOntologies sourceOntologies} to indicate creating
             * a new mapping.
             */
            self.createMapping = function() {
                self.editMapping = true;
                self.newMapping = true;
                self.mapping = {
                    jsonld: [],
                    record: {},
                    ontology: undefined,
                    difference: {
                        additions: [],
                        deletions: []
                    }
                };
                self.sourceOntologies = [];
                self.resetEdit();
                self.availablePropsByClass = {};
            }
            self.saveMapping = function() {
                var catalogId = _.get(cm.localCatalog, '@id', '');
                if (self.newMapping) {
                    return mm.upload(self.mapping.jsonld, self.mapping.record.title, self.mapping.record.description, self.mapping.record.keywords);
                } else {
                    return cm.createInProgressCommit(self.mapping.record.id, catalogId)
                        .then(() => cm.updateInProgressCommit(self.mapping.record.id, catalogId, self.mapping.difference), $q.reject)
                        .then(() => {
                            var commitMessage = 'Changed ' + _.join(_.concat(_.map(self.mapping.difference.additions, '@id'), _.map(self.mapping.difference.deletions, '@id')), ', ');
                            return cm.createBranchCommit(self.mapping.record.branch, self.mapping.record.id, catalogId, commitMessage);
                        }, $q.reject);
                }
            }
            /**
             * @ngdoc method
             * @name setInvalidProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Validates the current {@link mapperState.service:mapperStateService#mapping mapping} against
             * the currently loaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}
             * and sets {@link mapperState.service:mapperStateService#invalidProps} to the list of data properties in
             * the mapping that link to columns that don't exist in the delimited data.
             */
            self.setInvalidProps = function() {
                self.invalidProps = _.chain(mm.getAllDataMappings(self.mapping.jsonld))
                    .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                    .forEach(obj => _.set(obj, 'index', parseInt(util.getPropertyValue(obj, prefixes.delim + 'columnIndex'), 10)))
                    .filter(obj => obj.index > dm.dataRows[0].length - 1)
                    .sortBy('index')
                    .value();
            }
            /**
             * @ngdoc method
             * @name getMappedColumns
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Finds all of the column indexes that haven't been mapped to data mappings yet in the currently selected
             * {@link mapperState.service:mapperStateService#mapping mapping}.
             *
             * @return {string[]} an array of strings of column indexes that haven't been mapped yet
             */
            self.getMappedColumns = function() {
                return _.uniq(_.map(mm.getAllDataMappings(self.mapping.jsonld), dataMapping => util.getPropertyValue(dataMapping, prefixes.delim + 'columnIndex')));
            }
            /**
             * @ngdoc method
             * @name hasAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Returns the boolean indicating whether a class mapping has available properties to map.
             *
             * @param {string} classMappingId The id of the class mapping to check
             * @return {boolean} True if there are available properties to map for the class mapping;
             * false otherwise.
             */
            self.hasAvailableProps = function(classMappingId) {
                return _.get(self.availablePropsByClass, encodeURIComponent(classMappingId), []).length > 0;
            }
            /**
             * @ngdoc method
             * @name removeAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Removes a key-value pair from {@link mapperState.service:mapperStateService#availablePropsByClass availablePropsByClass}
             * using the passed class mapping id.
             *
             * @param {string} classMappingId The id of a class mapping to remove from the available
             * props list.
             */
            self.removeAvailableProps = function(classMappingId) {
                _.unset(self.availablePropsByClass, encodeURIComponent(classMappingId));
            }
            /**
             * @ngdoc method
             * @name setAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Sets the value for a class mapping in {@link mapperState.service:mapperStateService#availablePropsByClass availablePropsByClass}
             * to an array of objects representing properties that haven't been mapped for the class mapping
             * with the passed id
             *
             * @param {string} classMappingId The id of the class mapping to set the array of property objects for
             */
            self.setAvailableProps = function(classMappingId) {
                var mappedProps = _.map(mm.getPropMappingsByClass(self.mapping.jsonld, classMappingId), propMapping => util.getPropertyId(propMapping, prefixes.delim + 'hasProperty'));
                var classId = mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId);
                var props = _.concat(self.getClassProps(self.sourceOntologies, classId), _.map(mm.annotationProperties, id => {
                    return { ontologyId: '', propObj: {'@id': id} };
                }));
                _.set(self.availablePropsByClass, encodeURIComponent(classMappingId), _.filter(props, prop => mappedProps.indexOf(prop.propObj['@id']) < 0));
            }
            /**
             * @ngdoc method
             * @name getAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Retrieves an array of property objects from the current {@link mapperState.service:mapperStateService#mapping mapping}
             * representing the properties that the class mapping with the passed id hasn't used yet.
             *
             * @param {string} classMappingId The id of the class mapping to retrieve available properties of
             * @return {Object[]} An array of property objects for the properties that haven't been mapped yet
             * for the class mapping.
             */
            self.getAvailableProps = function(classMappingId) {
                return _.get(self.availablePropsByClass, encodeURIComponent(classMappingId), []);
            }
            /**
             * @ngdoc method
             * @name getClassProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Collects a list of objects representing the properties that can be mapped for a class from
             * a list of ontologies created by the {@link mappingManager.service:mappingManagerService mappingManagerService}.
             *
             * @param {Object[]} ontologies A list of ontology objects to collect properties from
             * @param {string} classId The id of the class to collect properties for
             * @return {Object[]} An array of objects with a property object and parent ontology id of properties
             * that can be mapped for the specified class.
             */
            self.getClassProps = function(ontologies, classId) {
                var props = [];
                _.forEach(ontologies, ontology => {
                    var classProps = _.filter(_.union(om.getClassProperties([ontology.entities], classId), om.getNoDomainProperties([ontology.entities])), prop => !(om.isObjectProperty(prop) && om.isDataTypeProperty(prop)));
                    props = _.union(props, _.map(classProps, prop => {
                        return {ontologyId: ontology.id, propObj: prop};
                    }));
                });
                return props;
            }
            /**
             * @ngdoc method
             * @name getClasses
             * @methodOf mapperState.service:mapperStateService
             *
             * @description
             * Collects a list of objects representing all the classes from a list of ontologies created by the
             * {@link mappingManager.service:mappingManagerService mappingManagerService}
             *
             * @param {Object[]} ontologies A list of ontology objects to collect properties from
             * @return {Object[]} An array of objects with the class object and parent ontology id of classes
             */
            self.getClasses = function(ontologies) {
                var classes = [];
                _.forEach(ontologies, ontology => {
                    classes = _.concat(classes, _.map(om.getClasses([ontology.entities]), classObj => {
                        return {ontologyId: ontology.id, classObj};
                    }));
                });
                return classes;
            }

            self.changeProp = function(entityId, propId, newValue, originalValue) {
                if (newValue !== originalValue) {
                    var additionsObj = _.find(self.mapping.difference.additions, {'@id': entityId});
                    var deletionsObj = _.find(self.mapping.difference.deletions, {'@id': entityId});
                    if (originalValue && !util.getPropertyValue(deletionsObj, propId)) {
                        additionsObj[propId] = [{'@value': newValue}];
                    } else {
                        if (additionsObj) {
                            additionsObj[propId] = [{'@value': newValue}];
                        } else {
                            additionsObj = {'@id': entityId, [propId]: [{'@value': newValue}]};
                            self.mapping.difference.additions.push(additionsObj);
                        }
                        if (originalValue !== undefined) {
                            if (deletionsObj) {
                                deletionsObj[propId] = [{'@value': originalValue}];
                            } else {
                                deletionsObj = {'@id': entityId, [propId]: [{'@value': originalValue}]};
                                self.mapping.difference.deletions.push(deletionsObj);
                            }
                        }
                    }
                }
            }

            self.deleteEntity = function(entity) {
                var additionsObj = _.find(self.mapping.difference.additions, {'@id': entity['@id']});
                if (_.isEqual(angular.copy(additionsObj), angular.copy(entity))) {
                    _.remove(self.mapping.difference.additions, additionsObj);
                } else {
                    var deletionObj = _.find(self.mapping.difference.deletions, {'@id': entity['@id']});
                    if (deletionObj) {
                        _.merge(deletionObj, entity);
                    } else {
                        self.mapping.difference.deletions.push(angular.copy(entity));
                    }
                }
            }

            self.deleteClass = function(classMappingId) {
                var propsLinkingToClass = _.map(mm.getPropsLinkingToClass(self.mapping.jsonld, classMappingId), propMapping => {
                    return {
                        propMapping,
                        classMappingId: mm.findClassWithObjectMapping(self.mapping.jsonld, propMapping['@id'])['@id']
                    };
                });
                var classMappingProps = mm.getPropMappingsByClass(self.mapping.jsonld, classMappingId);
                var deletedClass = mm.removeClass(self.mapping.jsonld, classMappingId);
                self.deleteEntity(deletedClass);
                _.forEach(classMappingProps, propMapping => {
                    _.remove(self.invalidProps, {'@id': propMapping['@id']})
                    self.deleteEntity(propMapping);
                });
                _.forEach(propsLinkingToClass, obj => cleanUpDeletedProp(obj.propMapping, obj.classMappingId));
                self.removeAvailableProps(classMappingId);
                var classId = mm.getClassIdByMapping(deletedClass);
                var ontology = mm.findSourceOntologyWithClass(classId, self.sourceOntologies);
                if (ontology) {
                    var classObj = om.getEntity([ontology.entities], classId);
                    self.availableClasses.push({ontologyId: ontology.id, classObj});
                }
            }

            self.deleteProp = function(propMappingId, parentClassMappingId) {
                var deletedProp = mm.removeProp(self.mapping.jsonld, parentClassMappingId, propMappingId);
                cleanUpDeletedProp(deletedProp, parentClassMappingId);
            }

            function cleanUpDeletedProp(propMapping, parentClassMappingId) {
                self.deleteEntity(propMapping);
                var propId = mm.getPropIdByMapping(propMapping);
                if (_.includes(mm.annotationProperties, propId)) {
                    self.getAvailableProps(parentClassMappingId).push({ontologyId: '', propObj: {'@id': propId}});
                } else {
                    var ontology = mm.findSourceOntologyWithProp(propId, self.sourceOntologies);
                    if (ontology) {
                        var propObj = om.getEntity([ontology.entities], propId);
                        self.getAvailableProps(parentClassMappingId).push({ontologyId: ontology.id, propObj});
                    }
                }
                var additionsObj = _.find(self.mapping.difference.additions, {'@id': parentClassMappingId});
                var prop = prefixes.delim + (mm.isDataMapping(propMapping) ? 'dataProperty' : 'objectProperty');
                if (util.hasPropertyId(additionsObj, prop, propMapping['@id'])) {
                    util.removePropertyId(additionsObj, prop, propMapping['@id'])
                } else {
                    var deletionsObj = _.find(self.mapping.difference.deletions, {'@id': parentClassMappingId});
                    if (deletionsObj) {
                        if (!_.has(deletionsObj, "['" + prop + "']")) {
                            deletionsObj[prop] = [];
                        }
                        deletionsObj[prop].push({'@id': propMapping['@id']});
                    } else {
                        self.mapping.difference.deletions.push({'@id': parentClassMappingId, [prop]: [{'@id': propMapping['@id']}]});
                    }
                }
                _.remove(self.invalidProps, {'@id': propMapping['@id']});
            }
        }
})();
