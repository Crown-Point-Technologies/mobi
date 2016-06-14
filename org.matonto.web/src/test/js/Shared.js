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

function injectRegexConstant() {
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('REGEX', {
                'IRI': new RegExp('[a-zA-Z]'),
                'LOCALNAME': new RegExp('[a-zA-Z]'),
                'FILENAME': new RegExp('[a-zA-Z]')
            });
        });
    });
}

function injectBeautifyFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter').and.callFake(function(str) {
                return '';
            }));
        });
    });
}

function injectSplitIRIFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
                return {
                    begin: '',
                    then: '',
                    end: ''
                }
            }));
        });
    });
}

function injectTrustedFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });
    });
}

function injectHighlightFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
        });
    });
}

function injectCamelCaseFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('camelCaseFilter', jasmine.createSpy('camelCaseFilter').and.callFake(function(str) {
                return str;
            }));
        });
    });
}

function mockOntologyManager() {
    module(function($provide) {
        $provide.service('ontologyManagerService', function($q) {
            this.getEntityName = jasmine.createSpy('getEntityName').and.callFake(function(entity) {
                return (entity && entity.hasOwnProperty('@id')) ? entity['@id'] : '';
            });
            this.getBeautifulIRI = jasmine.createSpy('getBeautifulIRI').and.callFake(function(iri) {
                return iri;
            });
            this.getList = jasmine.createSpy('getList').and.returnValue([]);
            this.getClassProperty = jasmine.createSpy('getClassProperty').and.returnValue({});
            this.getClassProperties = jasmine.createSpy('getClassProperties').and.returnValue([]);
            this.getClass = jasmine.createSpy('getClass').and.returnValue({});
            this.isObjectProperty = jasmine.createSpy('isObjectProperty').and.callFake(function(arr) {
                return arr && arr.indexOf('ObjectProperty') >= 0 ? true : false;
            });
            this.getClasses = jasmine.createSpy('getClasses').and.callFake(function(ontology) {
                if (ontology && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty('classes')) {
                    return ontology.matonto.classes;
                }
                return [];
            });
            this.getOntologyIds = jasmine.createSpy('getOntologyIds').and.returnValue([]);
            this.getThenRestructure = jasmine.createSpy('getThenRestructure').and.callFake(function(ontologyId) {
                return ontologyId ? $q.when({'@id': ontologyId}) : $q.reject('Something went wrong');
            });
            this.findOntologyWithClass = jasmine.createSpy('findOntologyWithClass').and.returnValue({});
            this.getImportedOntologies = jasmine.createSpy('getImportedOntologies').and.callFake(function(ontologyId) {
                return ontologyId ? $q.when([]) : $q.reject('Something went wrong');
            });
            this.getObjectCopyByIri = jasmine.createSpy('getObjectCopyByIri').and.returnValue({});
        });
    });
}

function mockMappingManager() {
    module(function($provide) {
        $provide.service('mappingManagerService', function($q) {
            this.previousMappingNames = [];
            this.mapping = undefined;
            this.sourceOntologies = [];

            this.uploadPut = jasmine.createSpy('uploadPut').and.callFake(function(mapping, mappingName) {
                return mapping ? $q.when(mappingName) : $q.reject('Something went wrong');
            });
            this.uploadPost = jasmine.createSpy('uploadPost').and.callFake(function(mapping) {
                return mapping ? $q.when('mappingName') : $q.reject('Something went wrong');
            });
            this.getMapping = jasmine.createSpy('getMapping').and.callFake(function(mappingName) {
                return mappingName ? $q.when([]) : $q.reject('Something went wrong');
            });
            this.downloadMapping = jasmine.createSpy('downloadMapping');
            this.deleteMapping = jasmine.createSpy('deleteMapping').and.callFake(function(mappingName) {
                return mappingName ? $q.when() : $q.reject('Something went wrong');
            });
            this.createNewMapping = jasmine.createSpy('createNewMapping').and.returnValue([]);
            this.setSourceOntology = jasmine.createSpy('setSourceOntology').and.returnValue([]);
            this.addClass = jasmine.createSpy('addClass').and.returnValue([]);
            this.editIriTemplate = jasmine.createSpy('editIriTemplate').and.returnValue([]);
            this.addDataProp = jasmine.createSpy('addDataProp').and.returnValue([]);
            this.addObjectProp = jasmine.createSpy('addObjectProp').and.returnValue([]);
            this.removeProp = jasmine.createSpy('removeProp').and.returnValue([]);
            this.removeClass = jasmine.createSpy('removeClass').and.returnValue([]);
            this.isObjectMapping = jasmine.createSpy('isObjectMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'ObjectMapping' ? true : false;
            });
            this.isDataMapping = jasmine.createSpy('isDataMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'DataMapping' ? true : false;
            });
            this.isClassMapping = jasmine.createSpy('isClassMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'ClassMapping' ? true : false;
            });
            this.getPropMappingsByClass = jasmine.createSpy('getPropMappingsByClass').and.returnValue([]);
            this.getSourceOntologyId = jasmine.createSpy('getSourceOntologyId').and.returnValue('');
            this.getSourceOntology = jasmine.createSpy('getSourceOntologyId').and.returnValue({});
            this.findClassWithObjectMapping = jasmine.createSpy('findClassWithObjectMapping').and.returnValue({});
            this.findClassWithDataMapping = jasmine.createSpy('findClassWithDataMapping').and.returnValue({});
            this.getClassIdByMapping = jasmine.createSpy('getClassIdByMapping').and.returnValue('');
            this.getPropIdByMapping = jasmine.createSpy('getPropIdByMapping').and.returnValue('');
            this.getClassIdByMappingId = jasmine.createSpy('getClassIdByMappingId').and.returnValue('');
            this.getPropIdByMappingId = jasmine.createSpy('getPropIdByMappingId').and.returnValue('');
            this.getAllClassMappings = jasmine.createSpy('getAllClassMappings').and.returnValue([]);
            this.getAllDataMappings = jasmine.createSpy('getAllDataMappings').and.returnValue([]);
            this.getDataMappingFromClass = jasmine.createSpy('getDataMappingFromClass').and.returnValue({});
            this.getPropMappingTitle = jasmine.createSpy('getPropMappingTitle').and.returnValue('');
        });
    });
}

function mockCsvManager() {
    module(function($provide) {
        $provide.service('csvManagerService', function($q) {
            this.fileObj = undefined;
            this.filePreview = undefined;
            this.fileName = '';
            this.separator = ',';
            this.containsHeaders = true;

            this.upload = jasmine.createSpy('upload').and.callFake(function(file) {
                return file ? $q.when('fileName') : $q.reject('Something went wrong');
            });
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
            this.map = jasmine.createSpy('map');
            this.reset = jasmine.createSpy('reset');
        });
    });
}

function mockMapperState() {
    module(function($provide) {
        $provide.service('mapperStateService', function() {
            this.fileUploadStep = 1;
            this.ontologySelectStep = 2;
            this.startingClassSelectStep = 3;
            this.editMappingStep = 4;
            this.finishStep = 5;
            this.editMapping = false;
            this.newMapping = false;
            this.step = 0;
            this.invalidProps = [];
            this.availableColumns = [];
            this.availableProps = [];
            this.openedClasses = [];
            this.invalidOntology = false;
            this.editMappingName = false;
            this.displayCancelConfirm = false;
            this.displayNewMappingConfirm = false;
            this.changeOntology = false;
            this.displayDeleteEntityConfirm = false;
            this.displayDeleteMappingConfirm = false;
            this.previewOntology = false;
            this.editIriTemplate = false;
            this.selectedClassMappingId = '';
            this.selectedPropMappingId = '';
            this.selectedProp = undefined;
            this.selectedColumn = '';
            this.newProp = false;
            this.deleteId = '';

            this.initialize = jasmine.createSpy('initialize');
            this.resetEdit = jasmine.createSpy('resetEdit');
            this.createMapping = jasmine.createSpy('createMapping');
            this.cacheSourceOntologies = jasmine.createSpy('cacheSourceOntologies');
            this.clearCachedSourceOntologies = jasmine.createSpy('clearCachedSourceOntologies');
            this.restoreCachedSourceOntologies = jasmine.createSpy('restoreCachedSourceOntologies');
            this.getCachedSourceOntologyId = jasmine.createSpy('getCachedSourceOntologyId').and.returnValue('');
            this.updateAvailableColumns = jasmine.createSpy('updateAvailableColumns');
            this.updateAvailableProps = jasmine.createSpy('updateAvailableProps');
            this.changedMapping = jasmine.createSpy('changedMapping');
            this.getMappedColumns = jasmine.createSpy('getMappedColumns').and.returnValue([]);
        });
    });
}

function mockCatalogManager() {
    module(function($provide) {
        $provide.service('catalogManagerService', function($q) {
            this.selectedResource = undefined;
            this.currentPage = 0;
            this.filters = {
                Resources: []
            };
            this.sortBy = '';
            this.asc = false;
            this.errorMessage = '';
            this.results = {
                size: 0,
                totalSize: 0,
                results: [],
                limit: 0,
                start: 0,
                links: {
                    base: '',
                    next: '',
                    prev: ''
                }
            };
            this.getResources = jasmine.createSpy('getResources');
            this.getSortOptions = jasmine.createSpy('getSortOptions').and.callFake(function() {
                return $q.when([]);
            });
            this.getResultsPage = jasmine.createSpy('getResultsPage');
            this.downloadResource = jasmine.createSpy('downloadResource');
            this.getType = jasmine.createSpy('getType').and.returnValue('');
            this.getDate = jasmine.createSpy('getDate').and.returnValue(new Date());
        });
    });
}

function mockPrefixes() {
    beforeEach(function() {
        angular.module('prefixes', []);

        module(function($provide) {
            $provide.service('prefixes', function() {
                this.owl = this.rdfs = this.rdf = this.delim = this.delimData = this.data = this.mappings = this.catalog = this.dc = '';
            });
        });
    });
}

function mockSparqlManager() {
    module(function($provide) {
        $provide.service('sparqlManagerService', function($q) {
            this.data = {
                head: {
                    vars: []
                },
                results: {
                    bindings: []
                }
            }
            this.prefixes = [];
            this.queryString = this.errorMessage = this.infoMessage = '';
            this.queryRdf = jasmine.createSpy('queryRdf').and.callFake(function() {
                return $q.resolve({});
            });
        });
    });
}

function mockSettingsManager() {
    module(function($provide) {
        $provide.service('settingsManagerService', function() {
            this.getSettings = jasmine.createSpy('getSettings').and.returnValue({});
            this.setSettings = jasmine.createSpy('setSettings').and.callFake(function(settings) {
                return settings;
            });
            this.getTreeDisplay = jasmine.createSpy('getTreeDisplay').and.returnValue('');
            this.getTooltipDisplay = jasmine.createSpy('getTooltipDisplay').and.returnValue('');
        });
    });
}

function mockStateManager() {
    module(function($provide) {
        $provide.service('stateManagerService', function() {
            this.states = {};
            this.setTreeTab = jasmine.createSpy('setTreeTab');
            this.setEditorTab = jasmine.createSpy('setEditorTab');
            this.getEditorTab = jasmine.createSpy('getEditorTab').and.returnValue('');
            this.setState = jasmine.createSpy('setState');
            this.getState = jasmine.createSpy('getState').and.returnValue({oi: 0, ci: 0, pi: 0});
            this.setStateToNew = jasmine.createSpy('setStateToNew').and.returnValue(0);
            this.clearState = jasmine.createSpy('clearState');
        });
    });
}

function mockResponseObj() {
    module(function($provide) {
        $provide.service('responseObj', function() {
            this.getItemIri = jasmine.createSpy('getItemIri').and.returnValue('');
            this.validateItem = jasmine.createSpy('validateItm').and.returnValue(true);
        });
    });
}