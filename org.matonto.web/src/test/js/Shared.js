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
function createQueryString(obj) {
    var queryString = '';
    var keys = Object.keys(obj);
    keys.forEach(function(key) {
        if (keys.indexOf(key) === 0) {
            queryString = queryString.concat('?');
        }
        queryString = queryString.concat(key + '=' + obj[key]);
        if (keys.indexOf(key) !== keys.length - 1) {
            queryString = queryString.concat('&');
        }
    });
    return queryString;
}

function injectChromaConstant() {
    module(function($provide) {
        $provide.constant('chroma', {
            scale: jasmine.createSpy('scale').and.returnValue({
                colors: jasmine.createSpy('colors').and.callFake(function(num) {
                    return _.fill(Array(num), '');
                })
            }),
            brewer: {
                Set1: ['']
            }
        });
    });
}

function injectRegexConstant() {
    module(function($provide) {
        $provide.constant('REGEX', {
            'IRI': new RegExp('[a-zA-Z]'),
            'LOCALNAME': new RegExp('[a-zA-Z]'),
            'FILENAME': new RegExp('[a-zA-Z]')
        });
    });
}

function injectIndentConstant() {
    module(function($provide) {
        $provide.constant('INDENT', 1);
    });
}

function injectBeautifyFilter() {
    module(function($provide) {
        $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter').and.callFake(_.identity));
    });
}

function injectSplitIRIFilter() {
    module(function($provide) {
        $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
            return {
                begin: '',
                then: '',
                end: ''
            }
        }));
    });
}

function injectTrustedFilter() {
    module(function($provide) {
        $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
    });
}

function injectHighlightFilter() {
    module(function($provide) {
        $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
    });
}

function injectCamelCaseFilter() {
    module(function($provide) {
        $provide.value('camelCaseFilter', jasmine.createSpy('camelCaseFilter').and.callFake(function(str) {
            return str;
        }));
    });
}

function injectShowPropertiesFilter() {
    module(function($provide) {
        var properties = ['prop1', 'prop2'];
        $provide.value('showPropertiesFilter', jasmine.createSpy('showPropertiesFilter').and.callFake(function(entity, arr) {
            return entity ? properties : [];
        }));
    });
}

function injectRemoveIriFromArrayFilter() {
    module(function($provide) {
        $provide.value('removeIriFromArrayFilter', jasmine.createSpy('removeIriFromArrayFilter').and.callFake(_.identity));
    });
}

function injectRemoveMatontoFilter() {
    module(function($provide) {
        $provide.value('removeMatontoFilter', jasmine.createSpy('removeMatontoFilter').and.callFake(_.identity));
    });
}

function injectPrefixationFilter() {
    module(function($provide) {
        $provide.value('prefixationFilter', jasmine.createSpy('prefixationFilter').and.callFake(_.identity));
    });
}

function injectInArrayFilter() {
    module(function($provide) {
        $provide.value('inArrayFilter', jasmine.createSpy('inArrayFilter').and.callFake(_.identity));
    });
}

function injectUsernameSearchFilter() {
    module(function($provide) {
        $provide.value('usernameSearchFilter', jasmine.createSpy('usernameSearchFilter').and.callFake(_.identity));
    });
}

function injectUniqueKeyFilter() {
    module(function($provide) {
        $provide.value('uniqueKeyFilter', jasmine.createSpy('uniqueKeyFilter').and.callFake(_.identity));
    });
}

function mockStateManager() {
    module(function($provide) {
        $provide.service('stateManagerService', function($q) {
            this.states = [];
            this.getStates = jasmine.createSpy('getStates').and.returnValue($q.when());
            this.createState = jasmine.createSpy('createStates').and.returnValue($q.when());
            this.getState = jasmine.createSpy('getState').and.returnValue($q.when());
            this.updateState = jasmine.createSpy('updateState').and.returnValue($q.when());
            this.deleteState = jasmine.createSpy('deleteState').and.returnValue($q.when());
            this.initialize = jasmine.createSpy('initialize');
            this.createOntologyState = jasmine.createSpy('createOntologyState').and.returnValue($q.when());
            this.getOntologyStateByRecordId = jasmine.createSpy('getOntologyStateByRecordId').and.returnValue({});
            this.updateOntologyState = jasmine.createSpy('updateOntologyState').and.returnValue($q.when());
            this.deleteOntologyState = jasmine.createSpy('deleteOntologyState').and.returnValue($q.when());
        });
    });
}

function mockOntologyManager() {
    module(function($provide) {
        $provide.service('ontologyManagerService', function($q) {
            this.ontologyRecords = [];
            this.ontologyProperties = [];
            this.conceptRelationshipList = [];
            this.schemeRelationshipList = [];
            this.defaultDatatypes = [];
            this.reset = jasmine.createSpy('reset');
            this.initialize = jasmine.createSpy('initialize');
            this.getAllOntologyRecords = jasmine.createSpy('getAllOntologyRecords').and.returnValue($q.when([]));
            this.uploadFile = jasmine.createSpy('uploadFile').and.returnValue($q.when({}));
            this.uploadJson = jasmine.createSpy('uploadJson').and.returnValue($q.when({}));
            this.getOntology = jasmine.createSpy('getOntology').and.returnValue($q.when({}));
            this.getIris = jasmine.createSpy('getIris').and.returnValue($q.when({}));
            this.getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue($q.when([]));
            this.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue($q.when({}));
            this.getClassesWithIndividuals = jasmine.createSpy('getClassesWithIndividuals').and.returnValue($q.when({}));
            this.getDataPropertyHierarchies = jasmine.createSpy('getDataPropertyHierarchies').and.returnValue($q.when({}));
            this.getObjectPropertyHierarchies = jasmine.createSpy('getObjectPropertyHierarchies').and.returnValue($q.when({}));
            this.getConceptHierarchies = jasmine.createSpy('getConceptHierarchies').and.returnValue($q.when({}));
            this.getImportedOntologies = jasmine.createSpy('getImportedOntologies').and.returnValue($q.when([]));
            this.getEntityUsages = jasmine.createSpy('getEntityUsages').and.returnValue($q.when([]));
            this.getSearchResults = jasmine.createSpy('getSearchResults');
            this.isOntology = jasmine.createSpy('isOntology');
            this.hasOntologyEntity = jasmine.createSpy('hasOntologyEntity');
            this.getOntologyEntity = jasmine.createSpy('getOntologyEntity').and.returnValue({});
            this.getOntologyIRI = jasmine.createSpy('getOntologyIRI').and.returnValue('');
            this.isClass = jasmine.createSpy('isClass');
            this.hasClasses = jasmine.createSpy('hasClasses').and.returnValue(true);
            this.getClasses = jasmine.createSpy('getClasses').and.returnValue([]);
            this.getClassIRIs = jasmine.createSpy('getClassIRIs').and.returnValue([]);
            this.getClassProperties = jasmine.createSpy('getClassProperties').and.returnValue([]);
            this.getClassPropertyIRIs = jasmine.createSpy('getClassPropertyIRIs').and.returnValue([]);
            this.getClassProperty = jasmine.createSpy('getClassProperty').and.returnValue({});

            this.getOntologyById = jasmine.createSpy('getOntologyById').and.returnValue([]);
            this.isObjectProperty = jasmine.createSpy('isObjectProperty');
            this.hasObjectProperties = jasmine.createSpy('hasObjectProperties').and.returnValue(true);
            this.getObjectProperties = jasmine.createSpy('getObjectProperties').and.returnValue([]);
            this.getObjectPropertyIRIs = jasmine.createSpy('getObjectPropertyIRIs').and.returnValue([]);
            this.isDataTypeProperty = jasmine.createSpy('isDataTypeProperty');
            this.hasDataTypeProperties = jasmine.createSpy('hasDataTypeProperties').and.returnValue(true);
            this.getDataTypeProperties = jasmine.createSpy('getDataTypeProperties').and.returnValue([]);
            this.getDataTypePropertyIRIs = jasmine.createSpy('getDataTypePropertyIRIs').and.returnValue([]);
            this.isProperty = jasmine.createSpy('isProperty').and.returnValue(true);
            this.hasNoDomainProperties = jasmine.createSpy('hasNoDomainProperties').and.returnValue(true);
            this.getNoDomainProperties = jasmine.createSpy('getNoDomainProperties').and.returnValue([]);
            this.getNoDomainPropertyIRIs = jasmine.createSpy('getNoDomainPropertyIRIs').and.returnValue([]);
            this.isAnnotation = jasmine.createSpy('isAnnotation');
            this.hasAnnotations = jasmine.createSpy('hasAnnotations').and.returnValue(true);
            this.getAnnotations = jasmine.createSpy('getAnnotations').and.returnValue([]);
            this.getAnnotationIRIs = jasmine.createSpy('getAnnotationIRIs').and.returnValue([]);
            this.isIndividual = jasmine.createSpy('isIndividual').and.returnValue(true);
            this.hasIndividuals = jasmine.createSpy('hasIndividuals').and.returnValue(true);
            this.getIndividuals = jasmine.createSpy('getIndividuals').and.returnValue([]);
            this.hasNoTypeIndividuals = jasmine.createSpy('hasIndividuals').and.returnValue(true);
            this.getNoTypeIndividuals = jasmine.createSpy('getIndividuals').and.returnValue([]);
            this.hasClassIndividuals = jasmine.createSpy('hasClassIndividuals').and.returnValue(true);
            this.getClassIndividuals = jasmine.createSpy('getClassIndividuals').and.returnValue([]);
            this.isRestriction = jasmine.createSpy('isRestriction').and.returnValue(true);
            this.getRestrictions = jasmine.createSpy('getRestrictions').and.returnValue([]);
            this.isBlankNode = jasmine.createSpy('isBlankNode').and.returnValue(true);
            this.isBlankNodeId = jasmine.createSpy('isBlankNodeId').and.returnValue(false);
            this.getBlankNodes = jasmine.createSpy('getBlankNodes').and.returnValue([]);
            this.getEntity = jasmine.createSpy('getEntity').and.returnValue({});
            this.getEntityName = jasmine.createSpy('getEntityName').and.callFake(function(ontology, entity) {
                return _.has(entity, '@id') ? entity['@id'] : '';
            });
            this.getEntityDescription = jasmine.createSpy('getEntityDescription').and.returnValue('');
            this.isConcept = jasmine.createSpy('isConcept').and.returnValue(true);
            this.hasConcepts = jasmine.createSpy('hasConcepts').and.returnValue(true);
            this.getConcepts = jasmine.createSpy('getConcepts').and.returnValue([]);
            this.getConceptIRIs = jasmine.createSpy('getConceptIRIs').and.returnValue([]);
            this.isConceptScheme = jasmine.createSpy('isConceptScheme').and.returnValue(true);
            this.hasConceptSchemes = jasmine.createSpy('hasConceptSchemes').and.returnValue(true);
            this.getConceptSchemes = jasmine.createSpy('getConceptSchemes').and.returnValue([]);
            this.getConceptSchemeIRIs = jasmine.createSpy('getConceptSchemeIRIs').and.returnValue([]);
            this.downloadOntology = jasmine.createSpy('downloadOntology');
            this.deleteOntology = jasmine.createSpy('deleteOntology').and.returnValue($q.when());
            this.getAnnotationPropertyHierarchies = jasmine.createSpy('getAnnotationPropertyHierarchies');
        });
    });
}

function mockMappingManager() {
    module(function($provide) {
        $provide.service('mappingManagerService', function($q) {
            this.mappingIds = [];

            this.reset = jasmine.createSpy('reset');
            this.initialize = jasmine.createSpy('initialize');
            this.upload = jasmine.createSpy('upload').and.returnValue($q.when());
            this.getMapping = jasmine.createSpy('getMapping').and.returnValue($q.when([]));
            this.downloadMapping = jasmine.createSpy('downloadMapping');
            this.updateMapping = jasmine.createSpy('updateMapping').and.returnValue($q.when());
            this.deleteMapping = jasmine.createSpy('deleteMapping').and.returnValue($q.when());
            this.getMappingId = jasmine.createSpy('getMappingId').and.returnValue('');
            this.createNewMapping = jasmine.createSpy('createNewMapping').and.returnValue([]);
            this.setSourceOntologyInfo = jasmine.createSpy('setSourceOntologyInfo').and.returnValue([]);
            this.copyMapping = jasmine.createSpy('copyMapping').and.returnValue([]);
            this.addClass = jasmine.createSpy('addClass').and.returnValue([]);
            this.editIriTemplate = jasmine.createSpy('editIriTemplate').and.returnValue([]);
            this.addDataProp = jasmine.createSpy('addDataProp').and.returnValue([]);
            this.addObjectProp = jasmine.createSpy('addObjectProp').and.returnValue([]);
            this.removeProp = jasmine.createSpy('removeProp').and.returnValue([]);
            this.removeClass = jasmine.createSpy('removeClass').and.returnValue([]);
            this.isPropertyMapping = jasmine.createSpy('isPropertyMapping').and.returnValue(true);
            this.isObjectMapping = jasmine.createSpy('isObjectMapping').and.returnValue(true);
            this.isDataMapping = jasmine.createSpy('isDataMapping').and.returnValue(true);
            this.isClassMapping = jasmine.createSpy('isClassMapping').and.returnValue(true);
            this.getPropMappingsByClass = jasmine.createSpy('getPropMappingsByClass').and.returnValue([]);
            this.getOntology = jasmine.createSpy('getOntology').and.returnValue($q.when({}));
            this.getSourceOntologies = jasmine.createSpy('getSourceOntologies').and.returnValue($q.when([]));
            this.findSourceOntologyWithClass = jasmine.createSpy('findSourceOntologyWithClass').and.returnValue({});
            this.findSourceOntologyWithProp = jasmine.createSpy('findSourceOntologyWithProp').and.returnValue({});
            this.getSourceOntologyId = jasmine.createSpy('getSourceOntologyId').and.returnValue('');
            this.getSourceOntologyInfo = jasmine.createSpy('getSourceOntologyInfo').and.returnValue({});
            this.getSourceOntology = jasmine.createSpy('getSourceOntologyId').and.returnValue({});
            this.areCompatible = jasmine.createSpy('areCompatible').and.returnValue(true);
            this.findIncompatibleMappings = jasmine.createSpy('findIncompatibleMappings').and.returnValue([]);
            this.findClassWithObjectMapping = jasmine.createSpy('findClassWithObjectMapping').and.returnValue({});
            this.findClassWithDataMapping = jasmine.createSpy('findClassWithDataMapping').and.returnValue({});
            this.getClassIdByMapping = jasmine.createSpy('getClassIdByMapping').and.returnValue('');
            this.getPropIdByMapping = jasmine.createSpy('getPropIdByMapping').and.returnValue('');
            this.getClassIdByMappingId = jasmine.createSpy('getClassIdByMappingId').and.returnValue('');
            this.getPropIdByMappingId = jasmine.createSpy('getPropIdByMappingId').and.returnValue('');
            this.getAllClassMappings = jasmine.createSpy('getAllClassMappings').and.returnValue([]);
            this.getAllDataMappings = jasmine.createSpy('getAllDataMappings').and.returnValue([]);
            this.getDataMappingFromClass = jasmine.createSpy('getDataMappingFromClass').and.returnValue({});
            this.getPropsLinkingToClass = jasmine.createSpy('getPropsLinkingToClass').and.returnValue([]);
            this.getPropMappingTitle = jasmine.createSpy('getPropMappingTitle').and.returnValue('');
            this.getBaseClass = jasmine.createSpy('getBaseClass').and.returnValue({});
            this.getClassMappingsByClassId = jasmine.createSpy('getClassMappingsByClassId').and.returnValue([]);
        });
    });
}

function mockDelimitedManager() {
    module(function($provide) {
        $provide.service('delimitedManagerService', function($q) {
            this.dataRows = undefined;
            this.fileName = '';
            this.separator = ',';
            this.containsHeaders = true;
            this.preview = '';

            this.upload = jasmine.createSpy('upload').and.returnValue($q.when(''));
            this.previewFile = jasmine.createSpy('previewFile').and.callFake(function(rowCount) {
                return rowCount ? $q.when() : $q.reject('Something went wrong');
            });
            this.previewMap = jasmine.createSpy('previewMap').and.callFake(function(jsonld, format) {
                if (jsonld) {
                    return format === 'jsonld' ? $q.when([]) : $q.when('');
                } else {
                    return $q.reject('Something went wrong');
                }
            });
            this.mapAndDownload = jasmine.createSpy('mapAndDownload');
            this.mapAndUpload = jasmine.createSpy('mapAndUpload').and.returnValue($q.when());
            this.reset = jasmine.createSpy('reset');
            this.getHeader = jasmine.createSpy('getHeader').and.returnValue('');
        });
    });
}

function mockMapperState() {
    module(function($provide) {
        $provide.service('mapperStateService', function() {
            this.selectMappingStep = 0;
            this.fileUploadStep = 1;
            this.editMappingStep = 2;
            this.mapping = undefined;
            this.sourceOntologies = [];
            this.mappingSearchString = '';
            this.availablePropsByClass = {};
            this.editMapping = false;
            this.newMapping = false;
            this.step = 0;
            this.invalidProps = [];
            this.availableClasses = [];
            this.availableColumns = [];
            this.invalidOntology = false;
            this.editMappingName = false;
            this.displayCancelConfirm = false;
            this.displayDeleteClassConfirm = false;
            this.displayDeletePropConfirm = false;
            this.displayDeleteMappingConfirm = false;
            this.displayCreateMappingOverlay = false;
            this.displayDownloadMappingOverlay = false;
            this.displayMappingConfigOverlay = false;
            this.displayPropMappingOverlay = false;
            this.editIriTemplate = false;
            this.selectedClassMappingId = '';
            this.selectedPropMappingId = '';
            this.newProp = false;
            this.highlightIndexes = [];
            this.changedMapping = false;

            this.initialize = jasmine.createSpy('initialize');
            this.resetEdit = jasmine.createSpy('resetEdit');
            this.createMapping = jasmine.createSpy('createMapping');
            this.setInvalidProps = jasmine.createSpy('setInvalidProps');
            this.updateAvailableColumns = jasmine.createSpy('updateAvailableColumns');
            this.getAvailableProps = jasmine.createSpy('getAvailableProps').and.returnValue([]);
            this.setAvailableProps = jasmine.createSpy('setAvailableProps');
            this.hasAvailableProps = jasmine.createSpy('hasAvailableProps');
            this.removeAvailableProps = jasmine.createSpy('removeAvailableProps');
            this.getClassProps = jasmine.createSpy('getClassProps').and.returnValue([]);
            this.getClasses = jasmine.createSpy('getClasses').and.returnValue([]);
            this.getMappedColumns = jasmine.createSpy('getMappedColumns').and.returnValue([]);
        });
    });
}

function mockHttpService() {
    module(function($provide) {
        $provide.service('httpService', function() {
            this.pending = [];
            this.isPending = jasmine.createSpy('isPending');
            this.cancel = jasmine.createSpy('cancel');
            this.get = jasmine.createSpy('get');
        });
    });
}

function mockPrefixes() {
    module(function($provide) {
        $provide.service('prefixes', function() {
            this.owl = this.rdf = this.delim = this.data = this.mappings = '';
            this.rdfs = 'rdfs:';
            this.dc = 'dc:';
            this.dcterms = 'dcterms:';
            this.rdf = 'rdf:';
            this.ontologyState = 'ontologyState:';
            this.catalog = 'catalog:';
            this.skos = 'skos:';
            this.xsd = 'xsd:';
            this.dataset = 'dataset:';
        });
    });
}

function mockUpdateRefs() {
    module(function($provide) {
        $provide.service('updateRefsService', function() {
            this.update = jasmine.createSpy('update');
            this.remove = jasmine.createSpy('remove');
        });
    });
}

function mockSparqlManager() {
    module(function($provide) {
        $provide.service('sparqlManagerService', function($q) {
            this.data = undefined;
            this.bindings = [];
            this.limit = 100;
            this.links = {
                next: '',
                prev: ''
            };
            this.currentPage = 0;
            this.totalSize = 0;
            this.bindings = [];
            this.queryString = '';
            this.datasetRecordIRI = '';
            this.errorMessage = '';
            this.infoMessage = '';
            this.reset = jasmine.createSpy('reset');
            this.queryRdf = jasmine.createSpy('queryRdf');
            this.downloadResults = jasmine.createSpy('downloadResults');
            this.setResults = jasmine.createSpy('setResults');
        });
    });
}

function mockSettingsManager() {
    module(function($provide) {
        $provide.service('settingsManagerService', function() {
            this.getSettings = jasmine.createSpy('getSettings').and.returnValue({});
            this.setSettings = jasmine.createSpy('setSettings').and.callFake(_.identity);
            this.getTreeDisplay = jasmine.createSpy('getTreeDisplay').and.returnValue('');
            this.getTooltipDisplay = jasmine.createSpy('getTooltipDisplay').and.returnValue('');
        });
    });
}

function mockOntologyState() {
    module(function($provide) {
        $provide.service('ontologyStateService', function($q) {
            this.recordIdToClose = 'recordIdToClose';
            this.state = {
                ontologyId: '',
                entityIRI: '',
                deletedEntities: [],
                type: ''
            };
            this.selected = {
                '@id': 'id',
                matonto: {
                    originalIri: 'iri'
                }
            };
            this.annotationSelect = 'select';
            this.annotationValue = 'value';
            this.annotationType = {'@id': 'annotationId'};
            this.key = 'key';
            this.index = 0;
            this.annotationIndex = 0;
            this.listItem = {
                annotations: [],
                dataPropertyRange: [],
                classHierarchy: [],
                subClasses: [],
                objectPropertyHierarchy: [],
                subObjectProperties: [],
                dataPropertyHierarchy: [],
                subDataProperties: [],
                blankNodes: {},
                individuals: [],
                index: {},
                recordId: 'recordId',
                branchId: 'branchId',
                commitId: 'commitId',
                ontologyId: 'ontologyId',
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                ontology: [{
                    '@id': 'id',
                    matonto: {
                        id: 'id',
                        jsAnnotations: [{}]
                    }
                }],
                upToDate: true,
                individualsParentPath: [],
                classesAndIndividuals: [],
                flatClassHierarchy: [],
                flatDataPropertyHierarchy: [],
                flatObjectPropertyHierarchy: [],
                annotationPropertyHierarchy: [],
                annotationPropertyIndex: {},
                flatAnnotationPropertyHierarchy: [],
                importedOntologies: [],
                importedOntologyIds: [],
                upToDate: true,
                conceptHierarchy: [],
                flatConceptHierarchy: []
            };
            this.states = {};
            this.list = [];
            this.initialize = jasmine.createSpy('initialize');
            this.reset = jasmine.createSpy('reset');
            this.getOntology = jasmine.createSpy('getOntology').and.returnValue({});
            this.createOntology = jasmine.createSpy('createOntology').and.returnValue($q.resolve({}));
            this.uploadThenGet = jasmine.createSpy('uploadThenGet').and.returnValue($q.resolve(''));
            this.updateOntology = jasmine.createSpy('updateOntology');
            this.addOntologyToList = jasmine.createSpy('addOntologyToList').and.returnValue($q.when([]));
            this.addVocabularyToList = jasmine.createSpy('addVocabularyToList').and.returnValue($q.when([]));
            this.createOntologyListItem = jasmine.createSpy('createOntologyListItem').and.returnValue($q.when([]));
            this.createVocabularyListItem = jasmine.createSpy('createVocabularyListItem').and.returnValue($q.when([]));
            this.addEntity = jasmine.createSpy('addEntity');
            this.removeEntity = jasmine.createSpy('removeEntity');
            this.getListItemByRecordId = jasmine.createSpy('getListItemByRecordId').and.returnValue({});
            this.getEntityByRecordId = jasmine.createSpy('getEntityByRecordId');
            this.getOntologyByRecordId = jasmine.createSpy('getOntologyByRecordId');
            this.getEntityNameByIndex = jasmine.createSpy('getEntityNameByIndex');
            this.saveChanges = jasmine.createSpy('saveChanges').and.returnValue($q.resolve({}));
            this.addToAdditions = jasmine.createSpy('addToAdditions');
            this.addToDeletions = jasmine.createSpy('addToDeletions');
            this.openOntology = jasmine.createSpy('openOntology').and.returnValue($q.resolve({}));
            this.closeOntology = jasmine.createSpy('closeOntology');
            this.removeBranch = jasmine.createSpy('removeBranch');
            this.afterSave = jasmine.createSpy('afterSave').and.returnValue($q.when([]));
            this.clearInProgressCommit = jasmine.createSpy('clearInProgressCommit');
            this.setOpened = jasmine.createSpy('setOpened');
            this.getOpened = jasmine.createSpy('getOpened').and.returnValue(false);
            this.setNoDomainsOpened = jasmine.createSpy('setNoDomainsOpened');
            this.getNoDomainsOpened = jasmine.createSpy('getNoDomainsOpened').and.returnValue(true);
            this.getUnsavedEntities = jasmine.createSpy('getUnsavedEntities');
            this.setIndividualsOpened = jasmine.createSpy('setIndividualsOpened');
            this.getIndividualsOpened = jasmine.createSpy('getIndividualsOpened').and.returnValue(false);
            this.getDataPropertiesOpened = jasmine.createSpy('getDataPropertiesOpened');
            this.setDataPropertiesOpened = jasmine.createSpy('setDataPropertiesOpened');
            this.getObjectPropertiesOpened = jasmine.createSpy('getObjectPropertiesOpened');
            this.setObjectPropertiesOpened = jasmine.createSpy('setObjectPropertiesOpened');
            this.getAnnotationPropertiesOpened = jasmine.createSpy('getAnnotationPropertiesOpened');
            this.setAnnotationPropertiesOpened = jasmine.createSpy('setAnnotationPropertiesOpened');
            this.onEdit = jasmine.createSpy('onEdit');
            this.setCommonIriParts = jasmine.createSpy('setCommonIriParts');
            this.setSelected = jasmine.createSpy('setSelected');
            this.setEntityUsages = jasmine.createSpy('setEntityUsages');
            this.addState = jasmine.createSpy('addState');
            this.setState = jasmine.createSpy('setState');
            this.getState = jasmine.createSpy('getState').and.returnValue({ontologyId: '', entityIRI: ''});
            this.deleteState = jasmine.createSpy('deleteState');
            this.resetStateTabs = jasmine.createSpy('resetStateTabs');
            this.getActiveKey = jasmine.createSpy('getActiveKey').and.returnValue('');
            this.getActivePage = jasmine.createSpy('getActivePage').and.returnValue({});
            this.getActiveEntityIRI = jasmine.createSpy('getActiveEntityIRI');
            this.selectItem = jasmine.createSpy('selectItem');
            this.unSelectItem = jasmine.createSpy('unSelectItem');
            this.hasChanges = jasmine.createSpy('hasChanges').and.returnValue(true);
            this.isCommittable = jasmine.createSpy('isCommittable');
            this.addEntityToHierarchy = jasmine.createSpy('addEntityToHierarchy');
            this.deleteEntityFromParentInHierarchy = jasmine.createSpy('deleteEntityFromParentInHierarchy');
            this.deleteEntityFromHierarchy = jasmine.createSpy('deleteEntityFromHierarchy');
            this.getPathsTo = jasmine.createSpy('getPathsTo');
            this.goTo = jasmine.createSpy('goTo');
            this.openAt = jasmine.createSpy('openAt');
            this.getDefaultPrefix = jasmine.createSpy('getDefaultPrefix');
            this.retrieveClassesWithIndividuals = jasmine.createSpy('retrieveClassesWithIndividuals');
            this.getIndividualsParentPath = jasmine.createSpy('getIndividualsParentPath');
            this.flattenHierarchy = jasmine.createSpy('flattenHierarchy');
            this.areParentsOpen = jasmine.createSpy('areParentsOpen');
            this.createFlatEverythingTree = jasmine.createSpy('createFlatEverythingTree');
            this.getOntologiesArray = jasmine.createSpy('getOntologiesArray').and.returnValue(this.listItem.ontology);
            this.createFlatIndividualTree = jasmine.createSpy('createFlatIndividualTree');
            this.updatePropertyIcon = jasmine.createSpy('updatePropertyIcon');
        });
    });
}

function mockOntologyUtilsManager() {
    module(function($provide) {
        $provide.service('ontologyUtilsManagerService', function() {
            this.commonDelete = jasmine.createSpy('commonDelete');
            this.deleteClass = jasmine.createSpy('deleteClass');
            this.deleteObjectProperty = jasmine.createSpy('deleteObjectProperty');
            this.deleteDataTypeProperty = jasmine.createSpy('deleteDataTypeProperty');
            this.deleteAnnotationProperty = jasmine.createSpy('deleteAnnotationProperty');
            this.deleteIndividual = jasmine.createSpy('deleteIndividual');
            this.deleteConcept = jasmine.createSpy('deleteConcept');
            this.deleteConceptScheme = jasmine.createSpy('deleteConceptScheme');
            this.getBlankNodeValue = jasmine.createSpy('getBlankNodeValue');
            this.isLinkable = jasmine.createSpy('isLinkable');
            this.getNameByNode = jasmine.createSpy('getNameByNode');
            this.addLanguageToNewEntity = jasmine.createSpy('addLanguageToNewEntity');
            this.saveCurrentChanges = jasmine.createSpy('saveCurrentChanges');
            this.updateLabel = jasmine.createSpy('updateLabel');
            this.getLabelForIRI = jasmine.createSpy('getLabelForIRI');
            this.getDropDownText = jasmine.createSpy('getDropDownText');
        });
    });
}

function mockResponseObj() {
    module(function($provide) {
        $provide.service('responseObj', function() {
            this.getItemIri = jasmine.createSpy('getItemIri').and.callFake(function(obj) {
                return (obj && obj.localName) ? obj.localName : obj;
            });
            this.validateItem = jasmine.createSpy('validateItem').and.returnValue(true);
            this.createItemFromIri = jasmine.createSpy('createItemFromIri');
        });
    });
}

function mockPropertyManager() {
    module(function($provide) {
        $provide.service('propertyManagerService', function($q) {
            this.defaultAnnotations = [];
            this.skosAnnotations = [];
            this.getDefaultAnnotations = jasmine.createSpy('getDefaultAnnotations').and.returnValue([]);
            this.remove = jasmine.createSpy('remove');
            this.add = jasmine.createSpy('add');
            this.edit = jasmine.createSpy('edit');
            this.create = jasmine.createSpy('create').and.returnValue($q.resolve({}));
        });
    });
}

function mockLoginManager() {
    module(function($provide) {
        $provide.service('loginManagerService', function($q) {
            this.currentUser = '';
            this.login = jasmine.createSpy('login').and.returnValue($q.when());
            this.logout = jasmine.createSpy('logout');
            this.isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue($q.when());
            this.getCurrentLogin = jasmine.createSpy('getCurrentLogin').and.returnValue($q.when());
        });
    });
}

function mockUserManager() {
    module(function($provide) {
        $provide.service('userManagerService', function($q) {
            this.users = [];
            this.groups = [];
            this.reset = jasmine.createSpy('reset');
            this.initialize = jasmine.createSpy('initialize');
            this.getUsername = jasmine.createSpy('getUsername').and.returnValue($q.when(''));
            this.setUsers = jasmine.createSpy('setUsers').and.returnValue($q.when());
            this.setGroups = jasmine.createSpy('setGroups').and.returnValue($q.when());
            this.addUser = jasmine.createSpy('addUser').and.returnValue($q.when());
            this.getUser = jasmine.createSpy('getUser').and.returnValue($q.when());
            this.updateUser = jasmine.createSpy('updateUser').and.returnValue($q.when());
            this.changePassword = jasmine.createSpy('changePassword').and.returnValue($q.when());
            this.resetPassword = jasmine.createSpy('resetPassword').and.returnValue($q.when());
            this.deleteUser = jasmine.createSpy('deleteUser').and.returnValue($q.when());
            this.addUserRoles = jasmine.createSpy('addUserRoles').and.returnValue($q.when());
            this.deleteUserRole = jasmine.createSpy('deleteUserRole').and.returnValue($q.when());
            this.addUserGroup = jasmine.createSpy('addUserGroup').and.returnValue($q.when());
            this.deleteUserGroup = jasmine.createSpy('deleteUserGroup').and.returnValue($q.when());
            this.addGroup = jasmine.createSpy('addGroup').and.returnValue($q.when());
            this.getGroup = jasmine.createSpy('getGroup').and.returnValue($q.when());
            this.updateGroup = jasmine.createSpy('updateGroup').and.returnValue($q.when());
            this.deleteGroup = jasmine.createSpy('deleteGroup').and.returnValue($q.when());
            this.addGroupRoles = jasmine.createSpy('addGroupRoles').and.returnValue($q.when());
            this.deleteGroupRole = jasmine.createSpy('deleteGroupRole').and.returnValue($q.when());
            this.getGroupUsers = jasmine.createSpy('getGroupUsers').and.returnValue($q.when([]));
            this.addGroupUsers = jasmine.createSpy('addGroupUsers').and.returnValue($q.when());
            this.deleteGroupUser = jasmine.createSpy('deleteGroupUser').and.returnValue($q.when());
            this.isAdmin = jasmine.createSpy('isAdmin');
        });
    });
}

function mockUserState() {
    module(function($provide) {
        $provide.service('userStateService', function() {
            this.userSearchString = '';
            this.groupSearchString = '';
            this.showGroups = false;
            this.showUsers = false;
            this.selectedGroup = undefined;
            this.selectedUser = undefined;
            this.memberName = '';
            this.displayDeleteUserConfirm = false;
            this.displayDeleteGroupConfirm = false;
            this.displayCreateUserOverlay = false;
            this.displayCreateGroupOverlay = false;
            this.displayRemoveMemberConfirm = false;
            this.displayEditGroupInfoOverlay = false;
            this.displayEditUserProfileOverlay = false;
            this.displayResetPasswordOverlay = false;
            this.reset = jasmine.createSpy('reset');
        });
    });
}

function mockCatalogManager() {
    module(function($provide) {
        $provide.service('catalogManagerService', function($q) {
            this.sortOptions = [];
            this.recordTypes = [];
            this.localCatalog = undefined;
            this.distributedCatalog = undefined;
            this.initialize = jasmine.createSpy('initialize').and.returnValue($q.when());
            this.getSortOptions = jasmine.createSpy('getSortOptions').and.returnValue($q.when([]));
            this.getRecordTypes = jasmine.createSpy('getRecordTypes').and.returnValue($q.when([]));
            this.getResultsPage = jasmine.createSpy('getResultsPage').and.returnValue($q.when({}));
            this.getRecords = jasmine.createSpy('getRecords').and.returnValue($q.when({}));
            this.getRecord = jasmine.createSpy('getRecord').and.returnValue($q.when({}));
            this.createRecord = jasmine.createSpy('createRecord').and.returnValue($q.when());
            this.updateRecord = jasmine.createSpy('updateRecord').and.returnValue($q.when());
            this.deleteRecord = jasmine.createSpy('deleteRecord').and.returnValue($q.when());
            this.getRecordDistributions = jasmine.createSpy('getRecordDistributions').and.returnValue($q.when({}));
            this.getRecordDistribution = jasmine.createSpy('getRecordDistribution').and.returnValue($q.when({}));
            this.createRecordDistribution = jasmine.createSpy('createRecordDistribution').and.returnValue($q.when());
            this.updateRecordDistribution = jasmine.createSpy('updateRecordDistribution').and.returnValue($q.when());
            this.deleteRecordDistribution = jasmine.createSpy('deleteRecordDistribution').and.returnValue($q.when());
            this.getRecordVersions = jasmine.createSpy('getRecordVersions').and.returnValue($q.when({}));
            this.getRecordLatestVersion = jasmine.createSpy('getRecordLatestVersion').and.returnValue($q.when({}));
            this.getRecordVersion = jasmine.createSpy('getRecordVersion').and.returnValue($q.when({}));
            this.createRecordVersion = jasmine.createSpy('createRecordVersion').and.returnValue($q.when());
            this.createRecordTag = jasmine.createSpy('createRecordTag').and.returnValue($q.when());
            this.updateRecordVersion = jasmine.createSpy('updateRecordVersion').and.returnValue($q.when());
            this.deleteRecordVersion = jasmine.createSpy('deleteRecordVersion').and.returnValue($q.when());
            this.getVersionCommit = jasmine.createSpy('getVersionCommit').and.returnValue($q.when({}));
            this.getVersionDistributions = jasmine.createSpy('getVersionDistributions').and.returnValue($q.when({}));
            this.getVersionDistribution = jasmine.createSpy('getVersionDistribution').and.returnValue($q.when({}));
            this.createVersionDistribution = jasmine.createSpy('createVersionDistribution').and.returnValue($q.when());
            this.updateVersionDistribution = jasmine.createSpy('updateVersionDistribution').and.returnValue($q.when());
            this.deleteVersionDistribution = jasmine.createSpy('deleteVersionDistribution').and.returnValue($q.when());
            this.getRecordBranches = jasmine.createSpy('getRecordBranches').and.returnValue($q.when({}));
            this.getRecordMasterBranch = jasmine.createSpy('getRecordMasterBranch').and.returnValue($q.when({}));
            this.getRecordBranch = jasmine.createSpy('getRecordBranch').and.returnValue($q.when({}));
            this.createRecordBranch = jasmine.createSpy('createRecordBranch').and.returnValue($q.when());
            this.createRecordUserBranch = jasmine.createSpy('createRecordUserBranch').and.returnValue($q.when());
            this.updateRecordBranch = jasmine.createSpy('updateRecordBranch').and.returnValue($q.when());
            this.deleteRecordBranch = jasmine.createSpy('deleteRecordBranch').and.returnValue($q.when());
            this.getBranchCommits = jasmine.createSpy('getBranchCommits').and.returnValue($q.when([]));
            this.createBranchCommit = jasmine.createSpy('createBranchCommit').and.returnValue($q.when());
            this.getBranchHeadCommit = jasmine.createSpy('getBranchHeadCommit').and.returnValue($q.when({}));
            this.getBranchCommit = jasmine.createSpy('getBranchCommit').and.returnValue($q.when({}));
            this.getBranchConflicts = jasmine.createSpy('getBranchConflicts').and.returnValue($q.when([]));
            this.mergeBranches = jasmine.createSpy('mergeBranches').and.returnValue($q.when(''));
            this.getResource = jasmine.createSpy('getResource').and.returnValue($q.when(''));
            this.downloadResource = jasmine.createSpy('downloadResource');
            this.createInProgressCommit = jasmine.createSpy('createInProgressCommit').and.returnValue($q.when());
            this.getInProgressCommit = jasmine.createSpy('getInProgressCommit').and.returnValue($q.when({}));
            this.updateInProgressCommit = jasmine.createSpy('updateInProgressCommit').and.returnValue($q.when());
            this.deleteInProgressCommit = jasmine.createSpy('deleteInProgressCommit').and.returnValue($q.when());
            this.getEntityName = jasmine.createSpy('getEntityName');
            this.isRecord = jasmine.createSpy('isRecord');
            this.isVersionedRDFRecord = jasmine.createSpy('isVersionedRDFRecord');
            this.isDistribution = jasmine.createSpy('isDistribution');
            this.isBranch = jasmine.createSpy('isBranch');
        });
    });
}

function mockCatalogState() {
    module(function($provide) {
        $provide.service('catalogStateService', function() {
            this.catalogs = {
                local: {
                    show: false,
                    catalog: {},
                    openedPath: [],
                    records: {
                        recordType: '',
                        sortOption: {},
                        searchText: '',
                        limit: 10
                    },
                    branches: {
                        sortOption: {},
                        limit: 10
                    }
                },
                distributed: {
                    show: false,
                    catalog: {},
                    openedPath: [],
                    records: {
                        recordType: '',
                        sortOption: {},
                        searchText: '',
                        limit: 10
                    }
                }
            };
            this.currentPage = 0;
            this.links = {
                prev: '',
                next: ''
            };
            this.totalSize = 0;
            this.results = [];
            this.initialize = jasmine.createSpy('initialize');
            this.reset = jasmine.createSpy('reset');
            this.resetPagination = jasmine.createSpy('resetPagination');
            this.setPagination = jasmine.createSpy('setPagination');
            this.getCurrentCatalog = jasmine.createSpy('getCurrentCatalog').and.returnValue({});
        });
    });
}

function mockUtil() {
    module(function($provide) {
        $provide.service('utilService', function($q) {
            this.getBeautifulIRI = jasmine.createSpy('getBeautifulIRI').and.callFake(_.identity);
            this.getPropertyValue = jasmine.createSpy('getPropertyValue').and.returnValue('');
            this.setPropertyValue = jasmine.createSpy('setPropertyValue').and.returnValue({});
            this.setPropertyId = jasmine.createSpy('setPropertyId').and.returnValue({});
            this.getPropertyId = jasmine.createSpy('getPropertyId').and.returnValue('');
            this.getDctermsValue = jasmine.createSpy('getDctermsValue').and.returnValue('');
            this.setDctermsValue = jasmine.createSpy('setDctermsValue').and.returnValue({});
            this.mergingArrays = jasmine.createSpy('mergingArrays');
            this.getDctermsValue = jasmine.createSpy('getPropertyValue').and.returnValue('');
            this.getDctermsId = jasmine.createSpy('getDctermsId').and.returnValue('');
            this.parseLinks = jasmine.createSpy('parseLinks').and.returnValue({});
            this.createErrorToast = jasmine.createSpy('createErrorToast');
            this.createSuccessToast = jasmine.createSpy('createSuccessToast');
            this.createJson = jasmine.createSpy('createJson').and.returnValue({});
            this.getIRINamespace = jasmine.createSpy('getIRINamespace').and.returnValue({});
            this.getDate = jasmine.createSpy('getDate').and.returnValue(new Date());
            this.condenseCommitId = jasmine.createSpy('condenseCommitId');
            this.paginatedConfigToParams = jasmine.createSpy('paginatedConfigToParams').and.returnValue({});
            this.onError = jasmine.createSpy('onError').and.callFake(function(error, deferred) {
                deferred.reject(_.get(error, 'statusText', ''));
            });
            this.getErrorMessage = jasmine.createSpy('getErrorMessage').and.returnValue('');
            this.getResultsPage = jasmine.createSpy('getResultsPage').and.returnValue($q.when({}));
            this.getChangesById = jasmine.createSpy('getChangesById');
            this.getPredicateLocalName = jasmine.createSpy('getPredicateLocalName');
        });
    });
}

function mockDatasetManager() {
    module(function($provide) {
        $provide.service('datasetManagerService', function($q) {
            this.datasetRecords = [];
            this.getResultsPage = jasmine.createSpy('getResultsPage').and.returnValue($q.when({}));
            this.getDatasetRecords = jasmine.createSpy('getDatasetRecords').and.returnValue($q.when({}));
            this.createDatasetRecord = jasmine.createSpy('createDatasetRecord').and.returnValue($q.when(''));
            this.deleteDatasetRecord = jasmine.createSpy('deleteDatasetRecord').and.returnValue($q.when());
            this.clearDatasetRecord = jasmine.createSpy('clearDatasetRecord').and.returnValue($q.when());
            this.initialize = jasmine.createSpy('initialize');
        });
    });
}

function mockDatasetState() {
    module(function($provide) {
        $provide.service('datasetStateService', function() {
            this.paginationConfig = {
                limit: 0,
                sortOption: {field: '', asc: true},
                pageIndex: 0,
                searchText: ''
            };
            this.totalSize = 0;
            this.links = {
                prev: '',
                next: ''
            };
            this.results = [];
            this.setResults = jasmine.createSpy('setResults');
            this.resetPagination = jasmine.createSpy('resetPagination');
            this.setPagination = jasmine.createSpy('setPagination');
        })
    })
}

function mockManchesterConverter() {
    module(function($provide) {
        $provide.service('manchesterConverterService', function() {
            this.jsonldToManchester = jasmine.createSpy('jsonldToManchester').and.returnValue('');
        });
    })
}

function mockToastr() {
    module(function($provide) {
        $provide.service('toastr', function() {
            this.error = jasmine.createSpy('error');
            this.success = jasmine.createSpy('success');
            this.info = jasmine.createSpy('info');
            this.warning = jasmine.createSpy('warning');
        });
    });
}

function mockDiscoverState() {
    module(function($provide) {
        $provide.service('discoverStateService', function() {
            this.explore = {
                active: true,
                instanceDetails: [],
                recordId: ''
            }
            this.query = {
                active: false
            }
        });
    });
}

function mockExplore() {
    module(function($provide) {
        $provide.service('exploreService', function($q) {
            this.getClassDetails = jasmine.createSpy('getClassDetails').and.returnValue($q.when([]));
        });
    });
}