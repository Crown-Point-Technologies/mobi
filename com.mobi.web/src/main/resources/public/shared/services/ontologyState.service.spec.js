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
import {
    mockPropertyManager,
    mockOntologyManager,
    mockUpdateRefs,
    mockStateManager,
    mockUtil,
    mockCatalogManager,
    mockPrefixes,
    mockManchesterConverter,
    mockHttpService,
    mockPolicyEnforcement,
    mockPolicyManager,
    injectSplitIRIFilter
} from '../../../../../test/js/Shared';

describe('Ontology State Service', function() {
    var ontologyStateSvc, $q, scope, util, stateManagerSvc, propertyManagerSvc, ontologyManagerSvc, updateRefsSvc, prefixes, catalogManagerSvc, policyEnforcementSvc, httpSvc, uuidSvc, $document, splitIRI, manchesterConverterSvc;
    var listItem;

    beforeEach(function() {
        angular.mock.module('shared');
        mockPropertyManager();
        mockOntologyManager();
        mockUpdateRefs();
        mockStateManager();
        mockUtil();
        mockCatalogManager();
        mockPrefixes();
        mockManchesterConverter();
        mockHttpService();
        mockPolicyEnforcement();
        mockPolicyManager();
        injectSplitIRIFilter();

        angular.mock.module(function($provide) {
            $provide.service('$document', function() {
                this.querySelectorAll = jasmine.createSpy('querySelectorAll');
            });
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(ontologyStateService, _updateRefsService_, _propertyManagerService_, _ontologyManagerService_, _catalogManagerService_, _policyEnforcementService_, _$q_, _$rootScope_, _utilService_, _stateManagerService_, _prefixes_, _httpService_, _uuid_, _$document_, _splitIRIFilter_, _manchesterConverterService_) {
            ontologyStateSvc = ontologyStateService;
            updateRefsSvc = _updateRefsService_;
            propertyManagerSvc = _propertyManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            policyEnforcementSvc = _policyEnforcementService_;
            $q = _$q_;
            scope = _$rootScope_;
            util = _utilService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            httpSvc = _httpService_;
            uuidSvc = _uuid_;
            $document = _$document_;
            splitIRI = _splitIRIFilter_;
            manchesterConverterSvc = _manchesterConverterService_;
        });

        splitIRI.and.returnValue({begin: 'begin'});

        this.error = 'error';
        this.format = 'jsonld';
        this.title = 'title';
        this.description = 'description';
        this.keywords = ['keyword1', 'keyword2'];
        this.inProgressCommit = {
            additions: ['test'],
            deletions: ['test']
        };
        this.emptyInProgressCommit = {
            additions: [],
            deletions: []
        };
        this.recordId = 'recordId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.tagId = 'tagId';
        this.ontologyId = 'ontologyId';
        this.catalogId = 'catalogId';
        this.classId = 'https://classId.com';
        this.objectPropertyId = 'objectPropertyId';
        this.datatypeId = 'datatypeId';
        this.annotationId = 'annotationId';
        this.dataPropertyId = 'dataPropertyId';
        this.individualId = 'individualId';
        this.conceptId = 'conceptId';
        this.conceptSchemeId = 'conceptSchemeId';
        this.semanticRelationId = 'semanticRelationId';

        this.branch = {
            '@id': this.branchId,
            [prefixes.catalog + 'head']: [{'@id': this.commitId}],
            [prefixes.dcterms + 'title']: [{'@value': 'MASTER'}]
        };
        this.tag = {
            '@id': this.tagId,
            '@type': [prefixes.catalog + 'Version', prefixes.catalog + 'Tag']
        };
        this.version = {
            '@id': 'version',
            '@type': [prefixes.catalog + 'Version']
        };
        this.differenceObj = {additions: '', deletions: ''};

        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        ontologyStateSvc.initialize();
        ontologyStateSvc.listItem = {
            ontologyRecord: {
                title: 'recordTitle',
                recordId: this.recordId,
                branchId: this.branchId,
                commitId: this.commitId
            }
        };
        ontologyStateSvc.listItem.selected = {'@id': 'id'};
        ontologyStateSvc.listItem.editorTabStates = {
            tab: {
                active: true,
                entityIRI: 'entityIRI',
                usages: [],
                open: {}
            },
            other: {active: false}
        };

        this.hierarchyInfo = {
            iris: {
                'node1a': this.ontologyId,
                'node1b': this.ontologyId,
                'node2a': this.ontologyId,
                'node2b': this.ontologyId,
                'node2c': this.ontologyId,
                'node3a': this.ontologyId,
                'node3b': this.ontologyId,
                'node3c': this.ontologyId,
            },
            parentMap: {
                'node1a': ['node2a', 'node2b', 'node2c'],
                'node1b': ['node3b'],
                'node2a': ['node3a', 'node3c'],
                'node2b': ['node3a'],
                'node2c': ['node3b'],
                'node3b': ['node3a'],
            },
            childMap: {
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node1b', 'node2c'],
                'node3c': ['node2a'],
            }
        };
        this.hierarchy = [{
            '@id': 'node1a',
            '@type': ['http://mobi.com/hierarchy#Node'],
            'http://mobi.com/hierarchy#child': [{
                '@id': 'node2a',
                '@type': ['http://mobi.com/hierarchy#Node'],
                'http://mobi.com/hierarchy#child': [{
                    '@id': 'node3a',
                    '@type': ['http://mobi.com/hierarchy#Node'],
                },
                {
                    '@id': 'node3c',
                    '@type': ['http://mobi.com/hierarchy#Node'],
                }]
            }, {
                '@id': 'node2b',
                '@type': ['http://mobi.com/hierarchy#Node'],
                'http://mobi.com/hierarchy#child': [{
                    '@id': 'node3a',
                    '@type': ['http://mobi.com/hierarchy#Node'],
                }]
            }, {
                '@id': 'node2c',
                '@type': ['http://mobi.com/hierarchy#Node'],
                'http://mobi.com/hierarchy#child': [{
                    '@id': 'node3b',
                    '@type': ['http://mobi.com/hierarchy#Node'],
                    'http://mobi.com/hierarchy#child': [{
                        '@id': 'node3a',
                        '@type': ['http://mobi.com/hierarchy#Node'],
                    }]
                }]
            }]
        }, {
            '@id': 'node1b',
            '@type': ['http://mobi.com/hierarchy#Node'],
            'http://mobi.com/hierarchy#child': [{
                '@id': 'node3b',
                '@type': ['http://mobi.com/hierarchy#Node'],
                'http://mobi.com/hierarchy#child': [{
                    '@id': 'node3a',
                    '@type': ['http://mobi.com/hierarchy#Node'],
                }]
            }]
        }];
        this.indexObject = {
            'node2a': ['node1a'],
            'node2b': ['node1a'],
            'node2c': ['node1a'],
            'node3a': ['node2a', 'node2b', 'node3b'],
            'node3b': ['node2c', 'node1b'],
            'node3c': ['node2a']
        };
        propertyManagerSvc.defaultDatatypes = _.concat(
            _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => prefixes.xsd + item),
            _.map(['langString'], item => prefixes.rdf + item)
        );
        this.ontologyObj = {
            '@id': this.ontologyId,
            '@type': [prefixes.owl + 'Ontology'],
            mobi: {
                anonymous: 'anonymous'
            }
        };
        this.classObj = {
            '@id': this.classId,
            '@type': [prefixes.owl + 'Class']
        };
        this.dataPropertyObj = {
            '@id': this.dataPropertyId,
            '@type': [prefixes.owl + 'DatatypeProperty']
        };
        this.individualObj = {
            '@id': this.individualId,
            '@type': [prefixes.owl + 'NamedIndividual', this.classId]
        };
        this.ontology = [this.ontologyObj, this.classObj, this.dataPropertyObj];
        this.path = 'this.is.the.path';
        this.getResponse = {
            recordId: this.recordId,
            branchId: this.branchId,
            commitId: this.commitId,
            upToDate: true,
            inProgressCommit: this.inProgressCommit,
            ontology: this.ontology
        };
        listItem = {
            ontology: this.ontology,
            ontologyId: this.ontologyId,
            importedOntologies: [],
            importedOntologyIds: [],
            ontologyRecord: {
                title: 'recordTitle',
                recordId: this.recordId,
                commitId: this.commitId,
                branchId: this.branchId
            },
            editorTabStates: {
                tab: {
                    active: true,
                    entityIRI: 'entityIRI',
                    usages: []
                },
                other: {active: false}
            },
            branches: [this.branch],
            tags: [this.tag],
            index: {
                ontologyId: {
                    position: 0,
                    label: 'ontology',
                    ontologyIri: this.ontologyId
                },
                'https://classId.com': {
                    position: 1,
                    label: 'class',
                    ontologyIri: this.ontologyId
                },
                dataPropertyId: {
                    position: 2,
                    label: 'data property',
                    ontologyIri: this.ontologyId
                },
            },
            upToDate: true,
            blankNodes: {},
            iriList: [this.ontologyId, this.classId, this.dataPropertyId],
            noDomainProperties: [],
            propertyIcons: {
                'iri1': 'icon',
                'iri2': 'icon',
                'iri3': 'icon'
            },
            classToChildProperties: {
                'class1': ['iri1', 'iri2'],
                'class2': ['iri2', 'iri5'],
                'class3': ['iri3', 'iri4']
            }
        };

        this.stateId = 'state-id';
        this.recordState = {
            '@type': [prefixes.ontologyState + 'StateRecord'],
            [prefixes.ontologyState + 'record']: [{'@id': this.recordId}],
        };
        this.ontologyState = [this.recordState];
    });

    afterEach(function() {
        ontologyStateSvc = null;
        $q = null;
        scope = null;
        util = null;
        stateManagerSvc = null;
        propertyManagerSvc = null;
        ontologyManagerSvc = null;
        updateRefsSvc = null;
        prefixes = null;
        catalogManagerSvc = null;
        policyEnforcementSvc = null;
        httpSvc = null;
        $document = null;
        splitIRI = null;
        manchesterConverterSvc = null;
        listItem = null;
    });

    it('reset should clear the correct variables', function() {
        ontologyStateSvc.reset();
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({});
        expect(ontologyStateSvc.showUploadTab).toEqual(false);
        expect(ontologyStateSvc.uploadList).toEqual([]);
    });
    describe('createOntologyState calls the correct method with the correct state', function() {
        it('if it is for a branch', function() {
            ontologyStateSvc.createOntologyState({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(stateManagerSvc.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateRecord'],
                    [prefixes.ontologyState + 'record']: [{'@id': this.recordId}],
                    [prefixes.ontologyState + 'branchStates']: [{'@id': jasmine.any(String)}],
                    [prefixes.ontologyState + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateBranch'],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                    [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                }
            ], 'ontology-editor');
        });
        it('if it is for a tag', function() {
            ontologyStateSvc.createOntologyState({recordId: this.recordId, commitId: this.commitId, tagId: this.tagId});
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(stateManagerSvc.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateRecord'],
                    [prefixes.ontologyState + 'record']: [{'@id': this.recordId}],
                    [prefixes.ontologyState + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateTag'],
                    [prefixes.ontologyState + 'tag']: [{'@id': this.tagId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                }
            ], 'ontology-editor');
        });
        it('if it is for a commit', function() {
            ontologyStateSvc.createOntologyState({recordId: this.recordId, commitId: this.commitId});
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(stateManagerSvc.createState).toHaveBeenCalledWith([
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateRecord'],
                    [prefixes.ontologyState + 'record']: [{'@id': this.recordId}],
                    [prefixes.ontologyState + 'currentState']: [{'@id': jasmine.any(String)}]
                },
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateCommit'],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                }
            ], 'ontology-editor');
        });
    });
    describe('getOntologyStateByRecordId', function() {
        it('when state is not present', function() {
            var result = ontologyStateSvc.getOntologyStateByRecordId(this.recordId);
            expect(result).toEqual(undefined);
        });
        it('when state is present', function() {
            stateManagerSvc.states = [{id: this.stateId, model: this.ontologyState}];
            var result = ontologyStateSvc.getOntologyStateByRecordId(this.recordId);
            expect(result).toEqual({id: this.stateId, model: this.ontologyState});
        });
    });
    describe('updateOntologyState calls the correct method with the correct state', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({
                id: this.stateId,
                model: this.ontologyState
            });
        });
        it('if a commit was current before', function() {
            this.commitState = {'@id': 'commitState', '@type': [prefixes.ontologyState + 'StateCommit']};
            this.recordState[prefixes.ontologyState + 'currentState'] = [{'@id': 'commitState'}];
            this.ontologyState.push(this.commitState);
            ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: 'newCommit', branchId: this.branchId});
            expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, {
                asymmetricMatch: actual => !_.includes(this.commitState)
            });
        });
        it('if a tag was current before', function() {
            this.tagState = {'@id': 'tagState', '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateTag']};
            this.recordState[prefixes.ontologyState + 'currentState'] = [{'@id': 'tagState'}];
            this.ontologyState.push(this.tagState);
            ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: 'newCommit', branchId: this.branchId});
            expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, {
                asymmetricMatch: actual => !_.includes(this.tagState)
            });
        });
        it('if just the commit is provided', function() {
            ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: this.commitId});
            expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, [
                _.set(this.recordState, "['" + prefixes.ontologyState + "currentState']", [{'@id': jasmine.any(String)}]),
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateCommit'],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                }
            ]);
        });
        it('if a tag is in the update', function() {
            ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: this.commitId, tagId: this.tagId});
            expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, [
                _.set(this.recordState, "['" + prefixes.ontologyState + "currentState']", [{'@id': jasmine.any(String)}]),
                {
                    '@id': jasmine.any(String),
                    '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateTag'],
                    [prefixes.ontologyState + 'tag']: [{'@id': this.tagId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                }
            ]);
        });
        describe('if a branch is in the update', function() {
            it('and the branch was opened before', function() {
                this.recordState[prefixes.ontologyState + 'branchStates'] = [{'@id': 'branchState'}];
                this.recordState[prefixes.ontologyState + 'currentState'] = [{'@id': 'branchState'}];
                this.ontologyState.push({
                    '@id': 'branchState',
                    '@type': [prefixes.ontologyState + 'StateBranch', prefixes.ontologyState + 'StateCommit'],
                    [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}],
                });
                ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: 'newCommit', branchId: this.branchId});
                expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, [
                    this.recordState,
                    {
                        '@id': 'branchState',
                        '@type': [prefixes.ontologyState + 'StateBranch', prefixes.ontologyState + 'StateCommit'],
                        [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                        [prefixes.ontologyState + 'commit']: [{'@id': 'newCommit'}],
                    }
                ]);
            });
            it('and the branch had not been opened before', function() {
                ontologyStateSvc.updateOntologyState({recordId: this.recordId, commitId: 'newCommit', branchId: this.branchId});
                expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, [
                    _.set(_.set(this.recordState, "['" + prefixes.ontologyState + "branchStates']", [{'@id': jasmine.any(String)}]), "['" + prefixes.ontologyState + "currentState']", [{'@id': jasmine.any(String)}]),
                    {
                        '@id': jasmine.any(String),
                        '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateBranch'],
                        [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                        [prefixes.ontologyState + 'commit']: [{'@id': 'newCommit'}]
                    }
                ]);
            });
        });
    });
    it('deleteOntologyState calls the correct method', function() {
        spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({
            id: this.stateId,
            model: this.ontologyState
        });
        ontologyStateSvc.deleteOntologyState(this.recordId);
        expect(stateManagerSvc.deleteState).toHaveBeenCalledWith(this.stateId);
    });
    it('deleteOntologyBranchState calls the correct method', function() {
        var tempState = _.cloneDeep(this.ontologyState);
        this.recordState[prefixes.ontologyState + 'branchStates'] = [{'@id': 'branchState'}];
        this.ontologyState.push({'@id': 'branchState', [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}]});
        spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({
            id: this.stateId,
            model: this.ontologyState
        });
        ontologyStateSvc.deleteOntologyBranchState(this.recordId, this.branchId);
        expect(stateManagerSvc.updateState).toHaveBeenCalledWith(this.stateId, tempState);
    });
    it('getCurrentStateIdByRecordId calls the correct methods', function() {
        spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({});
        spyOn(ontologyStateSvc, 'getCurrentStateId').and.returnValue('id');
        expect(ontologyStateSvc.getCurrentStateIdByRecordId('record')).toEqual('id');
        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith('record');
        expect(ontologyStateSvc.getCurrentStateId).toHaveBeenCalledWith({});
    });
    it('getCurrentStateByRecordId calls the correct methods', function() {
        spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({model: [{'@id': 'id'}]});
        spyOn(ontologyStateSvc, 'getCurrentStateId').and.returnValue('id');
        expect(ontologyStateSvc.getCurrentStateByRecordId('record')).toEqual({'@id': 'id'});
        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith('record');
        expect(ontologyStateSvc.getCurrentStateId).toHaveBeenCalledWith({model: [{'@id': 'id'}]});
    });
    it('getCurrentStateId calls the correct mehtods', function() {
        this.recordState[prefixes.ontologyState + 'currentState'] = [{'@id': 'id'}];
        expect(ontologyStateSvc.getCurrentStateId({model: this.ontologyState})).toEqual('id');
    });
    it('getCurrentState calls the correct mehtods', function() {
        spyOn(ontologyStateSvc, 'getCurrentStateId').and.returnValue('id');
        expect(ontologyStateSvc.getCurrentState({model: [{'@id': 'id'}]})).toEqual({'@id': 'id'});
    });
    it('isStateTag determines if an object is a StateTag', function() {
        var obj = {};
        expect(ontologyStateSvc.isStateTag(obj)).toEqual(false);
        obj['@type'] = ['Test'];
        expect(ontologyStateSvc.isStateTag(obj)).toEqual(false);
        obj['@type'].push(prefixes.ontologyState + 'StateTag');
        expect(ontologyStateSvc.isStateTag(obj)).toEqual(true);
    });
    it('isStateBranch determines if an object is a StateBranch', function() {
        var obj = {};
        expect(ontologyStateSvc.isStateBranch(obj)).toEqual(false);
        obj['@type'] = ['Test'];
        expect(ontologyStateSvc.isStateBranch(obj)).toEqual(false);
        obj['@type'].push(prefixes.ontologyState + 'StateBranch');
        expect(ontologyStateSvc.isStateBranch(obj)).toEqual(true);
    });
    describe('getOntology calls the correct methods', function() {
        beforeEach(function() {
            this.expected = {
                recordId: this.recordId,
                ontology: this.ontology,
                branchId: this.branchId,
                commitId: this.commitId,
                upToDate: true,
                inProgressCommit: this.inProgressCommit
            };
            this.expected2 = {
                recordId: this.recordId,
                ontology: this.ontology,
                branchId: this.branchId,
                commitId: this.commitId,
                upToDate: true,
                inProgressCommit: this.emptyInProgressCommit
            };
            spyOn(ontologyStateSvc, 'getLatestOntology');
        });
        describe('if state exists', function() {
            beforeEach(function() {
                this.recordState = {
                    '@id': 'id',
                    '@type': [prefixes.ontologyState + 'StateRecord'],
                    [prefixes.ontologyState + 'record']: [{'@id': this.recordId}],
                    [prefixes.ontologyState + 'currentState']: [{'@id': 'state-id'}],
                };
                this.commitState = {
                    '@id': 'state-id',
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}]
                };
                this.ontologyState = [
                    this.recordState,
                    this.commitState
                ];
                spyOn(ontologyStateSvc, 'getOntologyStateByRecordId').and.returnValue({model: this.ontologyState});
                spyOn(ontologyStateSvc, 'deleteOntologyState');
                util.getPropertyId.and.callFake((entity, propertyIRI) => _.get(entity, "[" + propertyIRI + "][0]['@id']", ''))
            });
            describe('and a branch was last checked out', function() {
                beforeEach(function() {
                    this.recordState[prefixes.ontologyState + 'branchStates'] = [{'@id': 'state-id'}];
                    this.commitState[prefixes.ontologyState + 'branch'] = [{'@id': this.branchId}];
                });
                describe('and getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                    });
                    describe('and getInProgressCommit is resolved', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
                        });
                        it('and getOntology is resolved', function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(response => {
                                    expect(response).toEqual(this.expected);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                            expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                        });
                        describe('and getOntology is rejected', function() {
                            beforeEach(function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                            });
                            describe('and deleteOntologyState is resolved', function() {
                                beforeEach(function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                });
                                it('and getLatestOntology is resolved', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                                it('and getLatestOntology is rejected', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                            });
                            it('and deleteOntologyState is rejected', function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                        });
                    });
                    describe('and getInProgressCommit is rejected', function() {
                        describe('with a 404', function() {
                            beforeEach(function() {
                                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 404}));
                            });
                            it('and getOntology is resolved', function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                            describe('and getOntology is rejected', function() {
                                beforeEach(function() {
                                    ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                                });
                                describe('and deleteOntologyState is resolved', function() {
                                    beforeEach(function() {
                                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                    });
                                    it('and getLatestOntology is resolved', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                        ontologyStateSvc.getOntology(this.recordId, this.format)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                    it('and getLatestOntology is rejected', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                });
                                it('and deleteOntologyState is rejected', function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                });
                            });
                        });
                        describe('without a 404', function() {
                            beforeEach(function() {
                                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 400}));
                            });
                            describe('and deleteOntologyState is resolved', function() {
                                beforeEach(function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                });
                                it('and getLatestOntology is resolved', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                                it('and getLatestOntology is rejected', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                            });
                            it('and deleteOntologyState is rejected', function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
                describe('and getRecordBranch is rejected', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                    });
                    describe('and deleteOntologyState is resolved', function() {
                        beforeEach(function() {
                            ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                        });
                        it('and getLatestOntology is resolved', function() {
                            ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(response => {
                                    expect(response).toEqual(this.expected2);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                            expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                        it('and getLatestOntology is rejected', function() {
                            ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                            expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                        });
                    });
                    it('and deleteOntologyState is rejected', function() {
                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.error);
                        });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
                        expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                        expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                    });
                });
            });
            describe('and a tag was last checked out', function() {
                beforeEach(function() {
                    this.commitState[prefixes.ontologyState + 'tag'] = [{'@id': this.tagId}];
                    this.expected.branchId = '';
                    this.expected2.branchId = '';
                });
                describe('and getRecordVersion is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordVersion.and.returnValue($q.when(this.tag));
                    });
                    describe('and getInProgressCommit is resolved', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
                        });
                        it('and getOntology is resolved', function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(response => {
                                    expect(response).toEqual(this.expected);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                            expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                        });
                        describe('and getOntology is rejected', function() {
                            beforeEach(function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                            });
                            describe('and deleteOntologyState is resolved', function() {
                                beforeEach(function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                });
                                it('and getLatestOntology is resolved', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                                it('and getLatestOntology is rejected', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                            });
                            it('and deleteOntologyState is rejected', function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                        });
                    });
                    describe('and getInProgressCommit is rejected', function() {
                        describe('with a 404', function() {
                            beforeEach(function() {
                                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 404}));
                            });
                            it('and getOntology is resolved', function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                            describe('and getOntology is rejected', function() {
                                beforeEach(function() {
                                    ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                                });
                                describe('and deleteOntologyState is resolved', function() {
                                    beforeEach(function() {
                                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                    });
                                    it('and getLatestOntology is resolved', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                        ontologyStateSvc.getOntology(this.recordId, this.format)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                    it('and getLatestOntology is rejected', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                });
                                it('and deleteOntologyState is rejected', function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                });
                            });
                        });
                        describe('without a 404', function() {
                            beforeEach(function() {
                                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 400}));
                            });
                            describe('and deleteOntologyState is resolved', function() {
                                beforeEach(function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                });
                                it('and getLatestOntology is resolved', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                                it('and getLatestOntology is rejected', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                            });
                            it('and deleteOntologyState is rejected', function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
                describe('and getRecordVersion is rejected', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordVersion.and.returnValue($q.reject(this.error));
                    });
                    describe('and updateOntologyState is resolved', function() {
                        beforeEach(function() {
                            spyOn(ontologyStateSvc, 'updateOntologyState').and.returnValue($q.when());
                        });
                        describe('and getInProgressCommit is resolved', function() {
                            beforeEach(function() {
                                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
                            });
                            it('and getOntology is resolved', function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                            describe('and getOntology is rejected', function() {
                                beforeEach(function() {
                                    ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                                });
                                describe('and deleteOntologyState is resolved', function() {
                                    beforeEach(function() {
                                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                    });
                                    it('and getLatestOntology is resolved', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                        ontologyStateSvc.getOntology(this.recordId, this.format)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                    it('and getLatestOntology is rejected', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                });
                                it('and deleteOntologyState is rejected', function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                });
                            });
                        });
                        describe('and getInProgressCommit is rejected', function() {
                            describe('with a 404', function() {
                                beforeEach(function() {
                                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 404}));
                                });
                                it('and getOntology is resolved', function() {
                                    ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                });
                                describe('and getOntology is rejected', function() {
                                    beforeEach(function() {
                                        ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                                    });
                                    describe('and deleteOntologyState is resolved', function() {
                                        beforeEach(function() {
                                            ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                        });
                                        it('and getLatestOntology is resolved', function() {
                                            ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                                .then(response => {
                                                    expect(response).toEqual(this.expected2);
                                                }, () => {
                                                    fail('Promise should have resolved');
                                                });
                                            scope.$apply();
                                            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                        });
                                        it('and getLatestOntology is rejected', function() {
                                            ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                            ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                                fail('Promise should have rejected');
                                            }, response => {
                                                expect(response).toEqual(this.error);
                                            });
                                            scope.$apply();
                                            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                            expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                        });
                                    });
                                    it('and deleteOntologyState is rejected', function() {
                                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                    });
                                });
                            });
                            describe('without a 404', function() {
                                beforeEach(function() {
                                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 400}));
                                });
                                describe('and deleteOntologyState is resolved', function() {
                                    beforeEach(function() {
                                        ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                    });
                                    it('and getLatestOntology is resolved', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                        ontologyStateSvc.getOntology(this.recordId, this.format)
                                            .then(response => {
                                                expect(response).toEqual(this.expected2);
                                            }, () => {
                                                fail('Promise should have resolved');
                                            });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                    it('and getLatestOntology is rejected', function() {
                                        ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                        ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                            fail('Promise should have rejected');
                                        }, response => {
                                            expect(response).toEqual(this.error);
                                        });
                                        scope.$apply();
                                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                        expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                        expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                        expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                    });
                                });
                                it('and deleteOntologyState is rejected', function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                    expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                                });
                            });
                        });
                    });
                    describe('and updateOntologyState is rejected', function() {
                        beforeEach(function() {
                            spyOn(ontologyStateSvc, 'updateOntologyState').and.returnValue($q.reject());
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            beforeEach(function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                            });
                            it('and getLatestOntology is resolved', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                            it('and getLatestOntology is rejected', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                                expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                                expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                        });
                        it('and deleteOntologyState is rejected', function() {
                            ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tagId, this.recordId, this.catalogId);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                            expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                        });
                    });
                });
            });
            describe('and a commit was last checked out', function() {
                beforeEach(function() {
                    this.expected.branchId = '';
                    this.expected2.branchId = '';
                });
                describe('and getInProgressCommit is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
                    });
                    it('and getOntology is resolved', function() {
                        ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                        ontologyStateSvc.getOntology(this.recordId, this.format)
                            .then(response => {
                                expect(response).toEqual(this.expected);
                            }, () => {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                        expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                    });
                    describe('and getOntology is rejected', function() {
                        beforeEach(function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            beforeEach(function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                            });
                            it('and getLatestOntology is resolved', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalledWith();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                            it('and getLatestOntology is rejected', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                        });
                        it('and deleteOntologyState is rejected', function() {
                            ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                            expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                        });
                    });
                });
                describe('and getInProgressCommit is rejected', function() {
                    describe('with a 404', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 404}));
                        });
                        it('and getOntology is resolved', function() {
                            ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                            ontologyStateSvc.getOntology(this.recordId, this.format)
                                .then(response => {
                                    expect(response).toEqual(this.expected2);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalledWith();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                            expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                        });
                        describe('and getOntology is rejected', function() {
                            beforeEach(function() {
                                ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                            });
                            describe('and deleteOntologyState is resolved', function() {
                                beforeEach(function() {
                                    ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                                });
                                it('and getLatestOntology is resolved', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                    ontologyStateSvc.getOntology(this.recordId, this.format)
                                        .then(response => {
                                            expect(response).toEqual(this.expected2);
                                        }, () => {
                                            fail('Promise should have resolved');
                                        });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                                it('and getLatestOntology is rejected', function() {
                                    ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                    ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual(this.error);
                                    });
                                    scope.$apply();
                                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                    expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                    expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                                });
                            });
                            it('and deleteOntologyState is rejected', function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, this.format);
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                            });
                        });
                    });
                    describe('without a 404', function() {
                        beforeEach(function() {
                            catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject({status: 400}));
                        });
                        describe('and deleteOntologyState is resolved', function() {
                            beforeEach(function() {
                                ontologyStateSvc.deleteOntologyState.and.returnValue($q.when());
                            });
                            it('and getLatestOntology is resolved', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                                ontologyStateSvc.getOntology(this.recordId, this.format)
                                    .then(response => {
                                        expect(response).toEqual(this.expected2);
                                    }, () => {
                                        fail('Promise should have resolved');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                            it('and getLatestOntology is rejected', function() {
                                ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                                ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
                            });
                        });
                        it('and deleteOntologyState is rejected', function() {
                            ontologyStateSvc.deleteOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.getOntology(this.recordId, this.format).then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
                            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
                            expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                            expect(ontologyStateSvc.getLatestOntology).not.toHaveBeenCalled();
                        });
                    });
                });
            });
        });
        describe('if state does not exist', function() {
            it('and getLatestOntology is resolved', function() {
                ontologyStateSvc.getLatestOntology.and.returnValue($q.when(this.expected2));
                ontologyStateSvc.getOntology(this.recordId, this.format)
                    .then(response => {
                        expect(response).toEqual(this.expected2);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
            });
            it('and getLatestOntology is rejected', function() {
                ontologyStateSvc.getLatestOntology.and.returnValue($q.reject(this.error));
                ontologyStateSvc.getOntology(this.recordId, this.format)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getLatestOntology).toHaveBeenCalledWith(this.recordId, this.format);
            });
        });
    });
    describe('getLatestOntology calls the correct methods', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'createOntologyState');
        });
        describe('if getRecordMasterBranch is resolved', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when(this.branch));
            });
            describe('and createOntologyState is resolved', function() {
                beforeEach(function() {
                    ontologyStateSvc.createOntologyState.and.returnValue($q.when());
                });
                it('and getOntology is resolved', function() {
                    var expected = {
                        recordId: this.recordId,
                        ontology: this.ontology,
                        branchId: this.branchId,
                        commitId: this.commitId,
                        upToDate: true,
                        inProgressCommit: this.emptyInProgressCommit
                    };
                    ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                    ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                        .then(response => {
                            expect(response).toEqual(expected);
                        }, () => {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                });
                it('and getOntology is rejected', function() {
                    ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                    expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.format);
                });
            });
            it('and createOntologyState is rejected', function() {
                ontologyStateSvc.createOntologyState.and.returnValue($q.reject(this.error));
                ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
                expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
            });
        });
        it('if getRecordMasterBranch is rejected', function() {
            catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject(this.error));
            ontologyStateSvc.getLatestOntology(this.recordId, this.format)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(ontologyStateSvc.createOntologyState).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
        });
    });
    describe('updateOntology should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [ontologyStateSvc.listItem];
            spyOn(ontologyStateSvc, 'updateOntologyState');
            spyOn(ontologyStateSvc, 'resetStateTabs');
        });
        describe('and getOntology resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
            });
            describe('and createOntologyListItem resolves', function() {
                beforeEach(function() {
                    spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.when(listItem));
                });
                describe('and updateOntologyState resolves', function() {
                    beforeEach(function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                    });
                    it('and the ontologyId changed', function() {
                        ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                            .then(_.noop, () => {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                    });
                    it('and the ontologyId is the same', function() {
                        ontologyStateSvc.listItem.ontologyId = this.ontologyId;
                        ontologyStateSvc.listItem.selected = {'@id': 'old'};
                        ontologyStateSvc.listItem.selectedBlankNodes = [{}];
                        ontologyStateSvc.listItem.blankNodes = {bnode: 'bnode'};
                        ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                            .then(_.noop, () => {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                        expect(listItem.selected).toEqual(ontologyStateSvc.listItem.selected);
                        expect(listItem.selectedBlankNodes).toEqual(ontologyStateSvc.listItem.selectedBlankNodes);
                        expect(listItem.blankNodes).toEqual(ontologyStateSvc.listItem.blankNodes);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                    });
                });
                it('and updateOntologyState rejects', function() {
                    ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.error);
                        });
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                    expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
                    expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                    expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, branchId: this.branchId});
                });
            });
            it('and createOntologyListItem rejects', function() {
                spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(this.error));
                ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId, listItem.upToDate)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
                expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.emptyInProgressCommit, listItem.upToDate, listItem.ontologyRecord.title);
            });
        });
        it('and getOntology rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
            ontologyStateSvc.updateOntology(this.recordId, this.branchId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, 'jsonld', false);
        });
    });
    describe('updateOntologyWithCommit should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [ontologyStateSvc.listItem];
            spyOn(ontologyStateSvc, 'updateOntologyState');
            spyOn(ontologyStateSvc, 'resetStateTabs');
        });
        describe('and getOntology resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
            });
            describe('and createOntologyListItem resolves', function() {
                beforeEach(function() {
                    spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.when(listItem));
                });
                describe('and a tagId is provided', function() {
                    describe('and updateOntologyState resolves', function() {
                        beforeEach(function() {
                            ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                        });
                        it('and the ontologyId changed', function() {
                            ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId, this.tagId)
                                .then(_.noop, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                            expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, tagId: this.tagId});
                        });
                        it('and the ontologyId is the same', function() {
                            ontologyStateSvc.listItem.ontologyId = this.ontologyId;
                            ontologyStateSvc.listItem.selected = {'@id': 'old'};
                            ontologyStateSvc.listItem.selectedBlankNodes = [{}];
                            ontologyStateSvc.listItem.blankNodes = {bnode: 'bnode'};
                            ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId, this.tagId)
                                .then(_.noop, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                            expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                            expect(listItem.selected).toEqual(ontologyStateSvc.listItem.selected);
                            expect(listItem.selectedBlankNodes).toEqual(ontologyStateSvc.listItem.selectedBlankNodes);
                            expect(listItem.blankNodes).toEqual(ontologyStateSvc.listItem.blankNodes);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, tagId: this.tagId});
                        });
                    });
                    it('and updateOntologyState rejects', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId, this.tagId)
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, tagId: this.tagId});
                    });
                });
                describe('and no tagId is provided', function() {
                    describe('and updateOntologyState resolves', function() {
                        beforeEach(function() {
                            ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                        });
                        it('and the ontologyId changed', function() {
                            ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId)
                                .then(_.noop, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                            expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                        });
                        it('and the ontologyId is the same', function() {
                            ontologyStateSvc.listItem.ontologyId = this.ontologyId;
                            ontologyStateSvc.listItem.selected = {'@id': 'old'};
                            ontologyStateSvc.listItem.selectedBlankNodes = [{}];
                            ontologyStateSvc.listItem.blankNodes = {bnode: 'bnode'};
                            ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId)
                                .then(_.noop, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                            expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                            expect(listItem.selected).toEqual(ontologyStateSvc.listItem.selected);
                            expect(listItem.selectedBlankNodes).toEqual(ontologyStateSvc.listItem.selectedBlankNodes);
                            expect(listItem.blankNodes).toEqual(ontologyStateSvc.listItem.blankNodes);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                        });
                    });
                    it('and updateOntologyState rejects', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId)
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                        scope.$apply();
                        expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                        expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalledWith(listItem);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId});
                    });
                });
            });
            it('and createOntologyListItem rejects', function() {
                spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(this.error));
                ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
                expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, '', this.commitId, this.ontology, this.emptyInProgressCommit, true, listItem.ontologyRecord.title);
            });
        });
        it('and getOntology rejects', function() {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject(this.error));
            ontologyStateSvc.updateOntologyWithCommit(this.recordId, this.commitId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(this.recordId, '', this.commitId, 'jsonld');
        });
    });
    describe('openOntology should call the proper methods', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'setSelected');
            spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
        });
        describe('when getOntology resolves', function() {
            beforeEach(function() {
                spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.when(this.getResponse));
                ontologyManagerSvc.getOntologyIRI.and.returnValue(this.ontologyId);
            });
            it('and addOntologyToList resolves', function() {
                spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.when(listItem));
                ontologyStateSvc.openOntology(this.recordId, this.title)
                    .then(response => {
                        expect(response).toEqual(this.ontologyId);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(this.ontology);
                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title, true);
                expect(ontologyStateSvc.getActiveEntityIRI).toHaveBeenCalled();
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
            });
            it('and addOntologyToList rejects', function() {
                spyOn(ontologyStateSvc, 'addOntologyToList').and.returnValue($q.reject(this.error));
                ontologyStateSvc.openOntology(this.recordId, this.title)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(this.ontology);
                expect(ontologyStateSvc.addOntologyToList).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.title, true);
            });
        });
        it('and getOntology rejects', function() {
            spyOn(ontologyStateSvc, 'getOntology').and.returnValue($q.reject(this.error));
            ontologyStateSvc.openOntology(this.recordId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
        });
    });
    it('closeOntology removes the correct object from the list', function() {
        ontologyStateSvc.list = [{ontologyRecord: {recordId: this.recordId}}];
        ontologyStateSvc.closeOntology(this.recordId);
        expect(ontologyStateSvc.list).toEqual([]);
        expect(ontologyStateSvc.listItem).toEqual({});
    });
    describe('removeBranch should call the correct methods', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
        });
        it('when getRecordVersions is resolved', function() {
            catalogManagerSvc.getRecordVersions.and.returnValue($q.when({data: [this.tag, {}]}));
            ontologyStateSvc.removeBranch(this.recordId, this.branchId)
                .then(_.noop, () => fail('Promise should have resolved'));
            scope.$apply();
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(catalogManagerSvc.getRecordVersions).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(listItem.branches).toEqual([]);
            expect(listItem.tags).toEqual([this.tag]);
        });
        it('when getRecordVersions is rejected', function() {
            catalogManagerSvc.getRecordVersions.and.returnValue($q.reject(this.error));
            ontologyStateSvc.removeBranch(this.recordId, this.branchId)
                .then(() => fail('Promise should have rejected'), response => expect(response).toEqual(this.error));
            scope.$apply();
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(catalogManagerSvc.getRecordVersions).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(listItem.branches).toEqual([]);
            expect(listItem.tags).toEqual([this.tag]);
        });
    });
    describe('saveChanges should call the correct methods', function() {
        it('when updateInProgressCommit resolves', function() {
            var resolved = 'this';
            catalogManagerSvc.updateInProgressCommit.and.returnValue($q.when(resolved));
            ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                .then(response => {
                    expect(response).toEqual(resolved);
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
        });
        it('when updateInProgressCommit rejects', function() {
            catalogManagerSvc.updateInProgressCommit.and.returnValue($q.reject(this.error));
            ontologyStateSvc.saveChanges(this.recordId, this.differenceObj)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
        });
    });
    describe('addToAdditions should call the correct functions', function() {
        it('when entity is in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': [{'@id': 'id'}]};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
        it('when entity is not in the additions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'additions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToAdditions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.additions[0]).toEqual(statement);
        });
    });
    describe('addToDeletions should call the correct functions', function() {
        it('when entity is in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': [{'@id': 'id'}]};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
        it('when entity is not in the deletions list', function() {
            var statement = {'@id': 'id', 'prop': 'value'};
            var listItem = {'deletions': []};
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            ontologyStateSvc.addToDeletions(this.recordId, statement);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
            expect(listItem.deletions[0]).toEqual(statement);
        });
    });
    describe('getListItemByRecordId should return the correct object', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [listItem];
        });
        it('when the ontologyId is in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId(this.recordId)).toEqual(listItem);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getListItemByRecordId('other')).toEqual(undefined);
        });
    });
    describe('getOntologyByRecordId should return the correct object', function() {
        it('when the ontologyId is in the list', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getOntologyByRecordId(this.recordId)).toEqual(listItem.ontology);
        });
        it('when the ontologyId is not in the list', function() {
            expect(ontologyStateSvc.getOntologyByRecordId('other')).toEqual([]);
        });
    });
    describe('createOntology calls the correct methods', function() {
        describe('when uploadJson succeeds', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadJson.and.returnValue($q.when({ontologyId: this.ontologyId, recordId: this.recordId, branchId: this.branchId, commitId: this.commitId}));
                ontologyStateSvc.list = [];
                spyOn(ontologyStateSvc, 'setSelected');
                spyOn(ontologyStateSvc, 'getActiveEntityIRI').and.returnValue('entityId');
            });
            it('and getRecordBranch resolves', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.when(this.branch));
                ontologyStateSvc.createOntology(this.ontologyObj, this.title, this.description, this.keywords)
                    .then(response => {
                        expect(response).toEqual({entityIRI: this.ontologyObj['@id'], recordId: this.recordId, branchId: this.branchId, commitId: this.commitId});
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.list.length).toBe(1);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith('entityId', false);
            });
            it('and getRecordBranch rejects', function() {
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject(this.error));
                ontologyStateSvc.createOntology(this.ontologyObj, this.title, this.description, this.keywords)
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual(this.error);
                    });
                scope.$apply();
            });
        });
        it('when uploadJson rejects', function() {
            ontologyManagerSvc.uploadJson.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntology(this.ontologyObj, this.title)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
        });
    });
    describe('getEntityByRecordId returns', function() {
        it('object when present using index', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue(listItem);
            expect(ontologyStateSvc.getEntityByRecordId(this.recordId, this.classId)).toEqual(this.classObj);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        //the operation to retrieve the object if it isn't in the index is too expensive
        //so we are no longer doing that.
        it('undefined when present not using index', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.returnValue({
                ontology: this.ontology,
                ontologyId: this.ontologyId,
                recordId: this.recordId,
                commitId: this.commitId,
                branchId: this.branchId,
                branches: [this.branch]
            });
            ontologyManagerSvc.getEntity.and.returnValue(this.classObj);
            expect(ontologyStateSvc.getEntityByRecordId(this.recordId, this.classId)).toBeUndefined();
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith(this.recordId);
        });
        it('undefined when not present', function() {
            spyOn(ontologyStateSvc, 'getListItemByRecordId').and.callThrough();
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            expect(ontologyStateSvc.getEntityByRecordId('', this.classId)).toEqual(undefined);
            expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith('');
        });
    });
    describe('getEntity returns the JSON-LD of the entity and its blank nodes', function() {
        it('successfully', function() {
            ontologyStateSvc.getEntity(this.classId, listItem)
                .then(response => {
                    expect(response).toEqual([]);
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.classId);
        });
        it('unless an error occurs', function() {
            ontologyManagerSvc.getEntityAndBlankNodes.and.returnValue($q.reject('Error'));
            ontologyStateSvc.getEntity(this.classId, listItem)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.classId);
        });
    });
    describe('getEntityNoBlankNodes returns the JSON-LD of the entity and its blank nodes', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getEntity').and.returnValue($q.when([{'@id': this.classId}, {}]))
        });
        it('successfully', function() {
            ontologyStateSvc.getEntityNoBlankNodes(this.classId, listItem)
                .then(response => {
                    expect(response).toEqual({'@id': this.classId});
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyStateSvc.getEntity).toHaveBeenCalledWith(this.classId, listItem);
        });
        it('unless an error occurs', function() {
            ontologyStateSvc.getEntity.and.returnValue($q.reject('Error'));
            ontologyStateSvc.getEntityNoBlankNodes(this.classId, listItem)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(ontologyStateSvc.getEntity).toHaveBeenCalledWith(this.classId, listItem);
        });
    });
    describe('removeEntity removes the entity from the provided ontology and index', function() {
        it('if it points to blank nodes', function() {
            listItem.index = {
                classA: {position: 0},
                bnode0: {position: 1},
                classB: {position: 2},
                bnode1: {position: 3},
                bnode2: {position: 4},
                classC: {position: 5}
            };
            listItem.ontology = [
                {'@id': 'classA', '@type': [], bnode0: [{'@value': 'A'}], propA: [{'@id': 'bnode2'}]},
                {'@id': 'bnode0', propA: [{'@id': 'bnode1'}]},
                {'@id': 'classB'},
                {'@id': 'bnode1', propA: [{'@id': 'classB'}]},
                {'@id': 'bnode2'},
                {'@id': 'classC'}
            ];
            listItem.iriList = ['classA'];
            ontologyManagerSvc.isBlankNodeId.and.callFake(iri => _.startsWith(iri, 'bnode'));
            listItem.blankNodes = {
                bnode0: 'bnode0',
                bnode1: 'bnode1',
                bnode2: 'bnode2',
                bnode3: 'bnode3'
            };
            expect(ontologyStateSvc.removeEntity(listItem, 'classA')).toEqual([
                {'@id': 'classA', '@type': [], bnode0: [{'@value': 'A'}], propA: [{'@id': 'bnode2'}]},
                {'@id': 'bnode0', propA: [{'@id': 'bnode1'}]},
                {'@id': 'bnode2'},
                {'@id': 'bnode1', propA: [{'@id': 'classB'}]}
            ]);
            expect(listItem.index).toEqual({classB: {position: 0}, classC: {position: 1}});
            expect(listItem.iriList).toEqual([]);
            expect(listItem.blankNodes).toEqual({bnode3: 'bnode3'});
        });
        it('if it does not point to blank nodes', function() {
            expect(ontologyStateSvc.removeEntity(listItem, this.classId)).toEqual([this.classObj]);
            expect(_.has(listItem.index, this.classId)).toBe(false);
            expect(listItem.index.dataPropertyId.position).toEqual(1);
            expect(listItem.iriList).not.toContain(this.classId);
            expect(listItem.blankNodes).toEqual({});
        });
    });
    describe('setVocabularyStuff sets the appropriate state variables on', function() {
        beforeEach(function() {
            this.response = {
                derivedConcepts: ['derivedConcept'],
                derivedConceptSchemes: ['derivedConceptScheme'],
                derivedSemanticRelations: ['derivedSemanticRelation'],
                concepts: ['derivedConcept1', 'derivedConcept2'],
                conceptSchemes: ['derivedConceptScheme1', 'derivedConceptScheme2'],
                conceptHierarchy: {
                    childMap: {'derivedConcept2': ['derivedConcept1']},
                    parentMap: {'derivedConcept1': ['derivedConcept2']}
                },
                conceptSchemeHierarchy: {
                    childMap: {'derivedConceptScheme2': ['derivedConceptScheme1']},
                    parentMap: {'derivedConceptScheme1': ['derivedConceptScheme2']}
                }
            };
            this.flatHierarchy = [{entityIRI: 'test'}];
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.returnValue(this.flatHierarchy);
        });
        describe('the current listItem when getVocabularyStuff', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.ontologyId = this.ontologyId;
                ontologyStateSvc.listItem.derivedConcepts = ['0'];
                ontologyStateSvc.listItem.derivedConceptSchemes = ['0'];
                ontologyStateSvc.listItem.derivedSemanticRelations = ['0'];
                ontologyStateSvc.listItem.concepts = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [{}]};
                ontologyStateSvc.listItem.conceptSchemes = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [{}]};
                ontologyStateSvc.listItem.editorTabStates.concepts = {entityIRI: 'iri', usages: []};
            });
            it('resolves', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.when(this.response));
                ontologyStateSvc.setVocabularyStuff();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyStateSvc.listItem.derivedConcepts).toEqual(['derivedConcept']);
                expect(ontologyStateSvc.listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
                expect(ontologyStateSvc.listItem.derivedSemanticRelations).toEqual(['derivedSemanticRelation']);
                expect(ontologyStateSvc.listItem.concepts.iris).toEqual({'derivedConcept1': this.ontologyId, 'derivedConcept2': this.ontologyId});
                expect(ontologyStateSvc.listItem.concepts.childMap).toEqual(this.response.conceptHierarchy.childMap);
                expect(ontologyStateSvc.listItem.concepts.parentMap).toEqual(this.response.conceptHierarchy.parentMap);
                expect(ontologyStateSvc.listItem.concepts.flat).toEqual(this.flatHierarchy);
                expect(ontologyStateSvc.listItem.conceptSchemes.iris).toEqual({'derivedConceptScheme1': this.ontologyId, 'derivedConceptScheme2': this.ontologyId});
                expect(ontologyStateSvc.listItem.conceptSchemes.childMap).toEqual(this.response.conceptSchemeHierarchy.childMap);
                expect(ontologyStateSvc.listItem.conceptSchemes.parentMap).toEqual(this.response.conceptSchemeHierarchy.parentMap);
                expect(ontologyStateSvc.listItem.conceptSchemes.flat).toEqual(this.flatHierarchy);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts, jasmine.objectContaining({ontologyId: ontologyStateSvc.listItem.ontologyId}));
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes, jasmine.objectContaining({ontologyId: ontologyStateSvc.listItem.ontologyId}));
                expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({});
                expect(util.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                var originalConcepts = angular.copy(ontologyStateSvc.listItem.concepts);
                var originalConceptSchemes = angular.copy(ontologyStateSvc.listItem.conceptSchemes);
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(this.error));
                ontologyStateSvc.setVocabularyStuff();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyStateSvc.listItem.derivedConcepts).toEqual(['0']);
                expect(ontologyStateSvc.listItem.derivedConceptSchemes).toEqual(['0']);
                expect(ontologyStateSvc.listItem.derivedSemanticRelations).toEqual(['0']);
                expect(ontologyStateSvc.listItem.concepts).toEqual(originalConcepts);
                expect(ontologyStateSvc.listItem.conceptSchemes).toEqual(originalConceptSchemes);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(this.error);
            });
        });
        describe('the provided listItem when getVocabularyStuff', function() {
            beforeEach(function() {
                listItem.derivedConcepts = ['0'];
                listItem.derivedConceptSchemes = ['0'];
                listItem.derivedSemanticRelations = ['0'];
                listItem.concepts = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [{}]};
                listItem.conceptSchemes = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [{}]};
                listItem.editorTabStates.concepts = {entityIRI: 'iri', usages: []};
            });
            it('resolves', function() {
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.when(this.response));
                ontologyStateSvc.setVocabularyStuff(listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(listItem.derivedConcepts).toEqual(['derivedConcept']);
                expect(listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
                expect(listItem.concepts.iris).toEqual({'derivedConcept1': listItem.ontologyId, 'derivedConcept2': listItem.ontologyId});
                expect(listItem.concepts.parentMap).toEqual(this.response.conceptHierarchy.parentMap);
                expect(listItem.concepts.childMap).toEqual(this.response.conceptHierarchy.childMap);
                expect(listItem.concepts.flat).toEqual(this.flatHierarchy);
                expect(listItem.conceptSchemes.iris).toEqual({'derivedConceptScheme1': listItem.ontologyId, 'derivedConceptScheme2': listItem.ontologyId});
                expect(listItem.conceptSchemes.parentMap).toEqual(this.response.conceptSchemeHierarchy.parentMap);
                expect(listItem.conceptSchemes.childMap).toEqual(this.response.conceptSchemeHierarchy.childMap);
                expect(listItem.conceptSchemes.flat).toEqual(this.flatHierarchy);
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(listItem.concepts, jasmine.objectContaining({ontologyId: listItem.ontologyId}));
                expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(listItem.conceptSchemes, jasmine.objectContaining({ontologyId: listItem.ontologyId}));
                expect(listItem.editorTabStates.concepts).toEqual({});
                expect(util.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                var originalConcepts = angular.copy(listItem.concepts);
                var originalConceptSchemes = angular.copy(listItem.conceptSchemes);
                ontologyManagerSvc.getVocabularyStuff.and.returnValue($q.reject(this.error));
                ontologyStateSvc.setVocabularyStuff(listItem);
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.vocabularySpinnerId);
                expect(ontologyManagerSvc.getVocabularyStuff).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, ontologyStateSvc.vocabularySpinnerId);
                expect(listItem.derivedConcepts).toEqual(['0']);
                expect(listItem.derivedConceptSchemes).toEqual(['0']);
                expect(listItem.derivedSemanticRelations).toEqual(['0']);
                expect(listItem.concepts).toEqual(originalConcepts);
                expect(listItem.conceptSchemes).toEqual(originalConceptSchemes);
                expect(ontologyStateSvc.flattenHierarchy).not.toHaveBeenCalled();
                expect(listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
                expect(util.createErrorToast).toHaveBeenCalledWith(this.error);
            });
        });
    });
    it('flattenHierarchy properly flattens the provided hierarchy', function() {
        spyOn(ontologyStateSvc, 'getEntityNameByIndex').and.callFake(_.identity);
        var hierarchyInfo = {
            iris: {
                'Class B': 'ontology',
                'Class B1': 'ontology',
                'Class B2': 'ontology',
                'Class A': 'ontology',
            },
            parentMap: {
                'Class B': ['Class B1', 'Class B2']
            },
            childMap: {
                'Class B1': ['Class B'],
                'Class B2': ['Class B']
            }
        }
        expect(ontologyStateSvc.flattenHierarchy(hierarchyInfo, {ontologyRecord: {recordId: this.recordId}})).toEqual([{
            entityIRI: 'Class A',
            hasChildren: false,
            path: [this.recordId, 'Class A'],
            joinedPath: this.recordId + '.Class A',
            indent: 0,
            entity: undefined
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: [this.recordId, 'Class B'],
            joinedPath: this.recordId + '.Class B',
            indent: 0,
            entity: undefined
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1'],
            joinedPath: this.recordId + '.Class B.Class B1',
            indent: 1,
            entity: undefined
        }, {
            entityIRI: 'Class B2',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B2'],
            joinedPath: this.recordId + '.Class B.Class B2',
            indent: 1,
            entity: undefined
        }]);
    });
    it('createFlatEverythingTree creates the correct array', function() {
        ontologyStateSvc.listItem = angular.copy(listItem);
        ontologyStateSvc.listItem.classes = {iris: {[this.classId]: this.ontologyId}};
        ontologyStateSvc.listItem.classToChildProperties = {'https://classId.com': [{'@id': 'property1'}]};
        ontologyStateSvc.listItem.noDomainProperties = [{'@id': 'property2'}],
        expect(ontologyStateSvc.createFlatEverythingTree(ontologyStateSvc.listItem)).toEqual([{
            '@id': this.classId,
            '@type': [prefixes.owl + 'Class'],
            hasChildren: true,
            indent: 0,
            path: [this.recordId, this.classId],
            joinedPath: this.recordId + '.' + this.classId
        }, {
            hasChildren: false,
            indent: 1,
            path: [this.recordId, this.classId, 'property1'],
            joinedPath: this.recordId + '.' + this.classId + '.property1'
        }, {
            title: 'Properties',
            get: ontologyStateSvc.getNoDomainsOpened,
            set: ontologyStateSvc.setNoDomainsOpened
        }, {
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: [this.recordId, 'property2'],
            joinedPath: this.recordId + '.property2'
        }]);
    });
    it('createFlatIndividualTree creates the correct array', function() {
        expect(ontologyStateSvc.createFlatIndividualTree({
            individualsParentPath: ['Class A', 'Class B', 'Class B1'],
            classesAndIndividuals: {
                'Class A': ['Individual A2', 'Individual A1'],
                'Class B1': ['Individual B1']
            },
            classes: { flat: [{
                entityIRI: 'Class A',
                hasChildren: false,
                path: [this.recordId, 'Class A'],
                joinedPath: this.recordId + '.Class A',
                indent: 0,
                entity: undefined
            }, {
                entityIRI: 'Class B',
                hasChildren: true,
                path: [this.recordId, 'Class B'],
                joinedPath: this.recordId + '.Class B',
                indent: 0,
                entity: undefined
            }, {
                entityIRI: 'Class B1',
                hasChildren: false,
                path: [this.recordId, 'Class B', 'Class B1'],
                joinedPath: this.recordId + '.Class B.Class B1',
                indent: 1,
                entity: undefined
            }, {
                entityIRI: 'Class B2',
                hasChildren: false,
                path: [this.recordId, 'Class B', 'Class B2'],
                joinedPath: this.recordId + '.Class B.Class B2',
                indent: 1,
                entity: undefined
            }] }
        })).toEqual([{
            entityIRI: 'Class A',
            hasChildren: false,
            path: [this.recordId, 'Class A'],
            joinedPath: this.recordId + '.Class A',
            indent: 0,
            entity: undefined,
            isClass: true
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: [this.recordId, 'Class A', 'Individual A1'],
            joinedPath: this.recordId + '.Class A.Individual A1',
            indent: 1,
            entity: undefined
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: [this.recordId, 'Class A', 'Individual A2'],
            joinedPath: this.recordId + '.Class A.Individual A2',
            indent: 1,
            entity: undefined
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: [this.recordId, 'Class B'],
            joinedPath: this.recordId + '.Class B',
            indent: 0,
            entity: undefined,
            isClass: true
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1'],
            joinedPath: this.recordId + '.Class B.Class B1',
            indent: 1,
            entity: undefined,
            isClass: true
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: [this.recordId, 'Class B', 'Class B1', 'Individual B1'],
            joinedPath: this.recordId + '.Class B.Class B1.Individual B1',
            indent: 2,
            entity: undefined
        }]);
        expect(ontologyStateSvc.createFlatIndividualTree({})).toEqual([]);
    });
    it('addEntity adds the entity to the provided ontology and index', function() {
        ontologyManagerSvc.getEntityName.and.returnValue('name');
        ontologyStateSvc.addEntity(listItem, this.individualObj);
        expect(this.ontology.length).toBe(4);
        expect(this.ontology[3]).toEqual(this.individualObj);
        expect(_.has(listItem.index, this.individualId)).toBe(true);
        expect(listItem.index[this.individualId].position).toEqual(3);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.individualObj);
        expect(listItem.index[this.individualId].label).toBe('name');
        expect(listItem.index[this.individualId].ontologyIri).toBe(this.ontologyId);
    });
    describe('getEntityNameByIndex should return the proper value', function() {
        it('when the entityIRI is in the index', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    iri: {
                        label: 'name'
                    }
                }
            })).toBe('name');
        });
        it('when the entityIRI is in the imported index', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    nomatchiri: {
                        label: 'name'
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            })).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    iri: {
                        label: 'name'
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            })).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices with only one label', function() {
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    iri: {
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                            label: 'importedname'
                        }
                    }
                }]
            })).toBe('importedname');
        });
        it('when the entityIRI is in multiple indices and no labels exist', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', {
                index: {
                    iri: {
                    }
                },
                importedOntologies: [{
                    index: {
                        iri: {
                        }
                    }
                }]
            })).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
        it('when the entityIRI is not in the index', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri')).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
        it('when the listItem is undefined', function() {
            util.getBeautifulIRI.and.returnValue('entity name');
            expect(ontologyStateSvc.getEntityNameByIndex('iri', undefined)).toBe('entity name');
            expect(util.getBeautifulIRI).toHaveBeenCalledWith('iri');
        });
    });
    describe('createOntologyListItem should call the correct functions', function() {
        beforeEach(function() {
            this.classId2 = prefixes.skos + 'Concept';
            this.dataPropertyId2 = 'dataPropertyId2';
            this.objectPropertyId2 = 'objectProperty2';
            this.datatypeId2 = 'datatypeId2';
            this.annotationId2 = 'annotationId2';
            this.individualId2 = 'individualId2';
            this.conceptId2 = 'conceptId2';
            this.conceptSchemeId2 = 'conceptSchemeId2';
            this.userBranchId = 'userBranchId';
            this.userBranch = {
                '@id': this.userBranchId
            }
            ontologyManagerSvc.getOntologyStuff.and.returnValue($q.when({
                propertyToRanges: {},
                iriList: {
                    annotationProperties: [this.annotationId],
                    classes: [this.classId],
                    datatypes: [this.datatypeId],
                    objectProperties: [this.objectPropertyId],
                    dataProperties: [this.dataPropertyId],
                    namedIndividuals: [this.individualId],
                    concepts: [this.conceptId],
                    conceptSchemes: [this.conceptSchemeId],
                    derivedConcepts: [this.classId],
                    derivedConceptSchemes: [this.classId],
                    derivedSemanticRelations: [this.semanticRelationId]
                },
                importedIRIs: [{
                    id: this.ontologyId,
                    annotationProperties: [this.annotationId2],
                    classes: [this.classId2],
                    dataProperties: [this.dataPropertyId2],
                    objectProperties: [this.objectPropertyId2],
                    namedIndividuals: [this.individualId2],
                    datatypes: [this.datatypeId2],
                    concepts: [this.conceptId2],
                    conceptSchemes: [this.conceptSchemeId2],
                }],
                importedOntologies: [{ontology: [], ontologyId: 'importId', id: 'id'}],
                classHierarchy: {parentMap: {}, childMap: {}},
                individuals: {ClassA: ['IndivA1', 'IndivA2']},
                dataPropertyHierarchy: {parentMap: {}, childMap: {}},
                objectPropertyHierarchy: {parentMap: {}, childMap: {}},
                annotationHierarchy: {parentMap: {}, childMap: {}},
                conceptHierarchy: {parentMap: {}, childMap: {}},
                conceptSchemeHierarchy: {parentMap: {}, childMap: {}},
                failedImports: ['failedId']
            }));
            this.branches = [this.branch, this.userBranch];
            this.versions = [this.tag, this.version];
            catalogManagerSvc.isUserBranch.and.callFake(branch => {
                if (branch['@id'] === this.branchId) {
                    return false;
                } else if (branch['@id'] === this.userBranchId) {
                    return true;
                }
            });
            catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: this.branches}));
            catalogManagerSvc.getRecordVersions.and.returnValue($q.when({data: this.versions}));
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when('Permit'));
            util.getPropertyId.and.returnValue(this.branchId);
            spyOn(ontologyStateSvc, 'flattenHierarchy').and.returnValue([{prop: 'flatten'}]);
            spyOn(ontologyStateSvc, 'createFlatEverythingTree').and.returnValue([{prop: 'everything'}]);
            spyOn(ontologyStateSvc, 'createFlatIndividualTree').and.returnValue([{prop: 'individual'}]);
            spyOn(ontologyStateSvc, 'getIndividualsParentPath').and.returnValue(['ClassA']);
        });
        describe('when all promises resolve', function() {
            it('and it is not a userBranch', function() {
                ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, false)
                    .then(response => {
                        var expectedIriObj = {};
                        expectedIriObj[this.annotationId] = this.ontologyId;
                        expectedIriObj[this.annotationId2] = this.ontologyId;
                        expect(_.get(response, 'annotations.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.classId] = this.ontologyId;
                        expectedIriObj[this.classId2] = this.ontologyId;
                        expect(_.get(response, 'classes.iris')).toEqual(expectedIriObj);
                        expect(response.isVocabulary).toEqual(true);
                        expectedIriObj = {};
                        expectedIriObj[this.dataPropertyId] = this.ontologyId;
                        expectedIriObj[this.dataPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.objectPropertyId] = this.ontologyId;
                        expectedIriObj[this.objectPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.individualId] = this.ontologyId;
                        expectedIriObj[this.individualId2] = this.ontologyId;
                        expect(_.get(response, 'individuals.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptId] = this.ontologyId;
                        expectedIriObj[this.conceptId2] = this.ontologyId;
                        expect(_.get(response, 'concepts.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptSchemeId] = this.ontologyId;
                        expectedIriObj[this.conceptSchemeId2] = this.ontologyId;
                        expect(_.get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.datatypeId] = this.ontologyId;
                        expectedIriObj[this.datatypeId2] = this.ontologyId;
                        expect(_.get(response, 'dataPropertyRange')).toEqual(expectedIriObj);
                        expect(_.get(response, 'derivedConcepts')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedConceptSchemes')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedSemanticRelations')).toEqual([this.semanticRelationId]);
                        expect(_.get(response, 'classes.parentMap')).toEqual({});
                        expect(_.get(response, 'classes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'classes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                        expect(_.get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
                        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalled();
                        expect(_.get(response, 'individualsParentPath')).toEqual(['ClassA']);
                        expect(_.get(response, 'dataProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'dataProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'dataProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'objectProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'objectProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'objectProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'branches')).toEqual(this.branches);
                        expect(_.get(response, 'tags')).toEqual([this.tag]);
                        expect(_.get(response, 'annotations.parentMap')).toEqual({});
                        expect(_.get(response, 'annotations.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'annotations.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'concepts.parentMap')).toEqual({});
                        expect(_.get(response, 'concepts.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'conceptSchemes.parentMap')).toEqual({});
                        expect(_.get(response, 'conceptSchemes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'upToDate')).toBe(false);
                        expect(_.get(response, 'iriList')).toEqual([this.ontologyId, this.annotationId, this.classId, this.datatypeId, this.objectPropertyId, this.dataPropertyId, this.individualId, this.conceptId, this.conceptSchemeId, this.semanticRelationId, this.annotationId2, this.classId2, this.dataPropertyId2, this.objectPropertyId2, this.individualId2, this.datatypeId2, this.conceptId2, this.conceptSchemeId2]);
                        expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'individuals.flat')).toEqual([{prop: 'individual'}]);
                        expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                        expect(_.get(response, 'importedOntologyIds')).toEqual(['id']);
                        expect(_.get(response, 'importedOntologies')).toEqual([{
                            id: 'id',
                            ontologyId: 'importId',
                            ontology: [],
                            index: {}
                        }]);
                        expect(_.get(response, 'userBranch')).toEqual(false);
                        expect(_.get(response, 'createdFromExists')).toEqual(true);
                        expect(_.get(response, 'masterBranchIRI')).toEqual(this.branchId);
                        expect(_.get(response, 'userCanModify')).toEqual(true);
                        expect(_.get(response, 'userCanModifyMaster')).toEqual(true);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyStuff).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
            it('and it is a userBranch', function() {
                ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.userBranchId, this.commitId, this.ontology, this.inProgressCommit, false)
                    .then(response => {
                        var expectedIriObj = {};
                        expectedIriObj[this.annotationId] = this.ontologyId;
                        expectedIriObj[this.annotationId2] = this.ontologyId;
                        expect(_.get(response, 'annotations.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.classId] = this.ontologyId;
                        expectedIriObj[this.classId2] = this.ontologyId;
                        expect(_.get(response, 'classes.iris')).toEqual(expectedIriObj);
                        expect(response.isVocabulary).toEqual(true);
                        expectedIriObj = {};
                        expectedIriObj[this.dataPropertyId] = this.ontologyId;
                        expectedIriObj[this.dataPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.objectPropertyId] = this.ontologyId;
                        expectedIriObj[this.objectPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.individualId] = this.ontologyId;
                        expectedIriObj[this.individualId2] = this.ontologyId;
                        expect(_.get(response, 'individuals.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptId] = this.ontologyId;
                        expectedIriObj[this.conceptId2] = this.ontologyId;
                        expect(_.get(response, 'concepts.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptSchemeId] = this.ontologyId;
                        expectedIriObj[this.conceptSchemeId2] = this.ontologyId;
                        expect(_.get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.datatypeId] = this.ontologyId;
                        expectedIriObj[this.datatypeId2] = this.ontologyId;
                        expect(_.get(response, 'dataPropertyRange')).toEqual(expectedIriObj);
                        expect(_.get(response, 'derivedConcepts')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedConceptSchemes')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedSemanticRelations')).toEqual([this.semanticRelationId]);
                        expect(_.get(response, 'classes.parentMap')).toEqual({});
                        expect(_.get(response, 'classes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'classes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                        expect(_.get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
                        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalled();
                        expect(_.get(response, 'individualsParentPath')).toEqual(['ClassA']);
                        expect(_.get(response, 'dataProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'dataProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'dataProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'objectProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'objectProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'objectProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'branches')).toEqual(this.branches);
                        expect(_.get(response, 'tags')).toEqual([this.tag]);
                        expect(_.get(response, 'annotations.parentMap')).toEqual({});
                        expect(_.get(response, 'annotations.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'annotations.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'concepts.parentMap')).toEqual({});
                        expect(_.get(response, 'concepts.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'conceptSchemes.parentMap')).toEqual({});
                        expect(_.get(response, 'conceptSchemes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'upToDate')).toBe(false);
                        expect(_.get(response, 'iriList')).toEqual([this.ontologyId, this.annotationId, this.classId, this.datatypeId, this.objectPropertyId, this.dataPropertyId, this.individualId, this.conceptId, this.conceptSchemeId, this.semanticRelationId, this.annotationId2, this.classId2, this.dataPropertyId2, this.objectPropertyId2, this.individualId2, this.datatypeId2, this.conceptId2, this.conceptSchemeId2]);
                        expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'individuals.flat')).toEqual([{prop: 'individual'}]);
                        expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                        expect(_.get(response, 'importedOntologyIds')).toEqual(['id']);
                        expect(_.get(response, 'importedOntologies')).toEqual([{
                            id: 'id',
                            ontologyId: 'importId',
                            ontology: [],
                            index: {}
                        }]);
                        expect(_.get(response, 'userBranch')).toEqual(true);
                        expect(_.get(response, 'createdFromExists')).toEqual(true);
                        expect(_.get(response, 'masterBranchIRI')).toEqual(this.branchId);
                        expect(_.get(response, 'userCanModify')).toEqual(true);
                        expect(_.get(response, 'userCanModifyMaster')).toEqual(true);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyStuff).toHaveBeenCalledWith(this.recordId, this.userBranchId, this.commitId);
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
            it('and it is a userBranch whose createdFrom branch has been deleted', function() {
                util.getPropertyId.and.returnValue('deletedBranchId');
                ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.userBranchId, this.commitId, this.ontology, this.inProgressCommit, false)
                    .then(response => {
                        var expectedIriObj = {};
                        expectedIriObj[this.annotationId] = this.ontologyId;
                        expectedIriObj[this.annotationId2] = this.ontologyId;
                        expect(_.get(response, 'annotations.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.classId] = this.ontologyId;
                        expectedIriObj[this.classId2] = this.ontologyId;
                        expect(_.get(response, 'classes.iris')).toEqual(expectedIriObj);
                        expect(response.isVocabulary).toEqual(true);
                        expectedIriObj = {};
                        expectedIriObj[this.dataPropertyId] = this.ontologyId;
                        expectedIriObj[this.dataPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.objectPropertyId] = this.ontologyId;
                        expectedIriObj[this.objectPropertyId2] = this.ontologyId;
                        expect(_.get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.individualId] = this.ontologyId;
                        expectedIriObj[this.individualId2] = this.ontologyId;
                        expect(_.get(response, 'individuals.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptId] = this.ontologyId;
                        expectedIriObj[this.conceptId2] = this.ontologyId;
                        expect(_.get(response, 'concepts.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.conceptSchemeId] = this.ontologyId;
                        expectedIriObj[this.conceptSchemeId2] = this.ontologyId;
                        expect(_.get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
                        expectedIriObj = {};
                        expectedIriObj[this.datatypeId] = this.ontologyId;
                        expectedIriObj[this.datatypeId2] = this.ontologyId;
                        expect(_.get(response, 'dataPropertyRange')).toEqual(expectedIriObj);
                        expect(_.get(response, 'derivedConcepts')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedConceptSchemes')).toEqual([this.classId]);
                        expect(_.get(response, 'derivedSemanticRelations')).toEqual([this.semanticRelationId]);
                        expect(_.get(response, 'classes.parentMap')).toEqual({});
                        expect(_.get(response, 'classes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'classes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
                        expect(_.get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
                        expect(ontologyStateSvc.getIndividualsParentPath).toHaveBeenCalled();
                        expect(_.get(response, 'individualsParentPath')).toEqual(['ClassA']);
                        expect(_.get(response, 'dataProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'dataProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'dataProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'objectProperties.parentMap')).toEqual({});
                        expect(_.get(response, 'objectProperties.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'objectProperties.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'branches')).toEqual(this.branches);
                        expect(_.get(response, 'tags')).toEqual([this.tag]);
                        expect(_.get(response, 'annotations.parentMap')).toEqual({});
                        expect(_.get(response, 'annotations.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'annotations.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'concepts.parentMap')).toEqual({});
                        expect(_.get(response, 'concepts.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'concepts.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'conceptSchemes.parentMap')).toEqual({});
                        expect(_.get(response, 'conceptSchemes.childMap')).toEqual({});
                        expect(ontologyStateSvc.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ontologyId: this.ontologyId}));
                        expect(_.get(response, 'conceptSchemes.flat')).toEqual([{prop: 'flatten'}]);
                        expect(_.get(response, 'upToDate')).toBe(false);
                        expect(_.get(response, 'iriList')).toEqual([this.ontologyId, this.annotationId, this.classId, this.datatypeId, this.objectPropertyId, this.dataPropertyId, this.individualId, this.conceptId, this.conceptSchemeId, this.semanticRelationId, this.annotationId2, this.classId2, this.dataPropertyId2, this.objectPropertyId2, this.individualId2, this.datatypeId2, this.conceptId2, this.conceptSchemeId2]);
                        expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'flatEverythingTree')).toEqual([{prop: 'everything'}]);
                        expect(ontologyStateSvc.createFlatIndividualTree).toHaveBeenCalledWith(response);
                        expect(_.get(response, 'individuals.flat')).toEqual([{prop: 'individual'}]);
                        expect(_.get(response, 'failedImports')).toEqual(['failedId']);
                        expect(_.get(response, 'importedOntologyIds')).toEqual(['id']);
                        expect(_.get(response, 'importedOntologies')).toEqual([{
                            id: 'id',
                            ontologyId: 'importId',
                            ontology: [],
                            index: {}
                        }]);
                        expect(_.get(response, 'userBranch')).toEqual(true);
                        expect(_.get(response, 'createdFromExists')).toEqual(false);
                        expect(_.get(response, 'masterBranchIRI')).toEqual(this.branchId);
                        expect(_.get(response, 'userCanModify')).toEqual(true);
                        expect(_.get(response, 'userCanModifyMaster')).toEqual(true);
                    }, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyStuff).toHaveBeenCalledWith(this.recordId, this.userBranchId, this.commitId);
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
        });
        it('when one call fails', function() {
            catalogManagerSvc.getRecordBranches.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
        });
        it('when more than one call fails', function() {
            ontologyManagerSvc.getOntologyStuff.and.returnValue($q.reject(this.error));
            catalogManagerSvc.getRecordBranches.and.returnValue($q.reject(this.error));
            ontologyStateSvc.createOntologyListItem(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
        });
    });
    it('getIndividualsParentPath should return the list of unique classes', function() {
        expect(ontologyStateSvc.getIndividualsParentPath({
            classesAndIndividuals: {
                classA: ['ind1', 'ind2'],
                classB: ['ind3', 'ind4']
            },
            classes: {
                childMap: {
                    classB: ['classA'],
                    classZ: ['classY']
                }
            }
        })).toEqual(['classA', 'classB']);
    });
    describe('addOntologyToList should call the correct functions', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [];
        });
        it('when createOntologyListItem resolves', function() {
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.when(listItem));
            ontologyStateSvc.addOntologyToList(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.recordId)
                .then(_.noop, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyStateSvc.list.length).toBe(1);
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true, this.recordId);
        });
        it('when createOntologyListItem rejects', function() {
            spyOn(ontologyStateSvc, 'createOntologyListItem').and.returnValue($q.reject(this.error));
            ontologyStateSvc.addOntologyToList(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, this.recordId)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(ontologyStateSvc.createOntologyListItem).toHaveBeenCalledWith(this.ontologyId, this.recordId, this.branchId, this.commitId, this.ontology, this.inProgressCommit, true, this.recordId);
        });
    });
    describe('afterSave calls the correct functions', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getOntologyStateByRecordId');
            spyOn(ontologyStateSvc, 'createOntologyState');
            spyOn(ontologyStateSvc, 'updateOntologyState');
        });
        describe('when getInProgressCommit resolves', function() {
            describe('and inProgressCommit is empty', function() {
                beforeEach(function() {
                    this.emptyInProgressCommit = {additions: [], deletions: []};
                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.emptyInProgressCommit));
                });
                describe('and deleteInProgressCommit resolves', function() {
                    beforeEach(function() {
                        catalogManagerSvc.deleteInProgressCommit.and.returnValue($q.when());
                    });
                    describe('and getOntologyStateByRecordId is empty', function() {
                        beforeEach(function() {
                            ontologyStateSvc.getOntologyStateByRecordId.and.returnValue({});
                        });
                        it('and createOntologyState resolves', function() {
                            ontologyStateSvc.createOntologyState.and.returnValue($q.when(this.recordId));
                            ontologyStateSvc.afterSave()
                                .then(response => {
                                    expect(response).toEqual(this.recordId);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.emptyInProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(_.has(ontologyStateSvc.listItem.editorTabStates, 'usages')).toBe(false);
                            expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        });
                        it('and createOntologyState rejects', function() {
                            ontologyStateSvc.createOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.afterSave()
                                .then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.emptyInProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        });
                    });
                    describe('and getOntologyStateByRecordId is present', function() {
                        beforeEach(function() {
                            ontologyStateSvc.getOntologyStateByRecordId.and.returnValue({id: 'id'});
                        });
                        it('and updateOntologyState resolves', function() {
                            ontologyStateSvc.updateOntologyState.and.returnValue($q.when(this.recordId));
                            ontologyStateSvc.afterSave()
                                .then(response => {
                                    expect(response).toEqual(this.recordId);
                                }, () => {
                                    fail('Promise should have resolved');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.emptyInProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        });
                        it('and updateOntologyState rejects', function() {
                            ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                            ontologyStateSvc.afterSave()
                                .then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual(this.error);
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.emptyInProgressCommit);
                            expect(ontologyStateSvc.listItem.additions).toEqual([]);
                            expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                            expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                            expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                            expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                            expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                        });
                    });
                });
                it('and deleteInProgressCommit rejects', function() {
                    catalogManagerSvc.deleteInProgressCommit.and.returnValue($q.reject(this.error));
                    ontologyStateSvc.afterSave()
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual(this.error);
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.emptyInProgressCommit);
                    expect(ontologyStateSvc.listItem.additions).toEqual([]);
                    expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                });
            });
            describe('and inProgressCommit has changes', function() {
                beforeEach(function() {
                    catalogManagerSvc.getInProgressCommit.and.returnValue($q.when(this.inProgressCommit));
                });
                describe('and getOntologyStateByRecordId is empty', function() {
                    beforeEach(function() {
                        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue({});
                    });
                    it('and createOntologyState resolves', function() {
                        ontologyStateSvc.createOntologyState.and.returnValue($q.when(this.recordId));
                        ontologyStateSvc.afterSave()
                            .then(response => {
                                expect(response).toEqual(this.recordId);
                            }, () => {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                        expect(ontologyStateSvc.listItem.additions).toEqual([]);
                        expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                        expect(catalogManagerSvc.deleteInProgressCommit).not.toHaveBeenCalled();
                        expect(_.has(ontologyStateSvc.listItem.editorTabStates, 'usages')).toBe(false);
                        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                    });
                    it('and createOntologyState rejects', function() {
                        ontologyStateSvc.createOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.afterSave()
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                        expect(ontologyStateSvc.listItem.additions).toEqual([]);
                        expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                        expect(catalogManagerSvc.deleteInProgressCommit).not.toHaveBeenCalled();
                        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.createOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                    });
                });
                describe('and getOntologyStateByRecordId is present', function() {
                    beforeEach(function() {
                        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue({id: 'id'});
                    });
                    it('and updateOntologyState resolves', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.when(this.recordId));
                        ontologyStateSvc.afterSave()
                            .then(response => {
                                expect(response).toEqual(this.recordId);
                            }, () => {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                        expect(ontologyStateSvc.listItem.additions).toEqual([]);
                        expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                        expect(catalogManagerSvc.deleteInProgressCommit).not.toHaveBeenCalled();
                        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                    });
                    it('and updateOntologyState rejects', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                        ontologyStateSvc.afterSave()
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual(this.error);
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.inProgressCommit).toEqual(this.inProgressCommit);
                        expect(ontologyStateSvc.listItem.additions).toEqual([]);
                        expect(ontologyStateSvc.listItem.deletions).toEqual([]);
                        expect(catalogManagerSvc.deleteInProgressCommit).not.toHaveBeenCalled();
                        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
                        expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: ontologyStateSvc.listItem.ontologyRecord.recordId, commitId: ontologyStateSvc.listItem.ontologyRecord.commitId, branchId: ontologyStateSvc.listItem.ontologyRecord.branchId});
                    });
                });
            });
        });
        it('when getInProgressCommit rejects', function() {
            catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
            ontologyStateSvc.afterSave()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual(this.error);
                });
            scope.$apply();
            expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
        });
    });
    it('clearInProgressCommit should clear the proper variables', function() {
        ontologyStateSvc.listItem = {
            inProgressCommit: {
                additions: ['addition'],
                deletions: ['deletion']
            }
        };
        ontologyStateSvc.clearInProgressCommit();
        expect(ontologyStateSvc.listItem.inProgressCommit.additions).toEqual([]);
        expect(ontologyStateSvc.listItem.inProgressCommit.deletions).toEqual([]);
    });
    it('setNoDomainsOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], value => {
            ontologyStateSvc.setNoDomainsOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.noDomainsOpened')).toBe(value);
        });
    });
    describe('getNoDomainsOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getNoDomainsOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], value => {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.noDomainsOpened', value);
                expect(ontologyStateSvc.getNoDomainsOpened(this.path)).toBe(value);
            });
        });
    });
    it('setDataPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], value => {
            ontologyStateSvc.setDataPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.dataPropertiesOpened')).toBe(value);
        });
    });
    describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getDataPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], value => {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.dataPropertiesOpened', value);
                expect(ontologyStateSvc.getDataPropertiesOpened(this.path)).toBe(value);
            });
        });
    });
    it('setObjectPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], value => {
            ontologyStateSvc.setObjectPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.objectPropertiesOpened')).toBe(value);
        });
    });
    describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getObjectPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], value => {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.objectPropertiesOpened', value);
                expect(ontologyStateSvc.getObjectPropertiesOpened(this.path)).toBe(value);
            });
        });
    });
    it('setAnnotationPropertiesOpened sets the correct property on the state object', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
        _.forEach([true, false], value => {
            ontologyStateSvc.setAnnotationPropertiesOpened(this.path, value);
            expect(_.get(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.annotationPropertiesOpened')).toBe(value);
        });
    });
    describe('getAnnotationPropertiesOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            expect(ontologyStateSvc.getAnnotationPropertiesOpened(this.path)).toBe(false);
        });
        it('when path is found', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('key');
            _.forEach([true, false], value => {
                _.set(ontologyStateSvc.listItem.editorTabStates, 'key.' + encodeURIComponent(this.path) + '.annotationPropertiesOpened', value);
                expect(ontologyStateSvc.getAnnotationPropertiesOpened(this.path)).toBe(value);
            });
        });
    });
    describe('onEdit calls the correct manager methods', function() {
        beforeEach(function() {
            this.iriBegin = 'begin';
            this.iriThen = 'then';
            this.iriEnd = 'end';
            this.newIRI = this.iriBegin + this.iriThen + this.iriEnd;
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
            spyOn(ontologyStateSvc, 'addToAdditions');
            spyOn(ontologyStateSvc, 'addToDeletions');
        });
        it('regardless of getEntityUsages outcome when no match in additions', function() {
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.selected['@id'], 'construct');
        });
        it('regardless of getEntityUsages outcome when match in additions', function() {
            ontologyStateSvc.listItem.additions = [angular.copy(ontologyStateSvc.listItem.selected)];
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(ontologyStateSvc.listItem, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, angular.copy(ontologyStateSvc.listItem.selected));
            expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.additions.length).toBe(0);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.selected['@id'], 'construct');
        });
        describe('when getActiveKey is', function() {
            it('project', function() {
                spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
                spyOn(ontologyStateSvc, 'setCommonIriParts');
                ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).not.toHaveBeenCalled();
            });
            it('not project', function() {
                spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('other');
                spyOn(ontologyStateSvc, 'setCommonIriParts');
                ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
                expect(ontologyStateSvc.setCommonIriParts).toHaveBeenCalledWith(this.iriBegin, this.iriThen);
            });
        });
        it('when getEntityUsages resolves', function() {
            var statement = {'@id': 'test-id'};
            var response = [statement];
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.when(response));
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            scope.$apply();
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
            expect(updateRefsSvc.update).toHaveBeenCalledWith(response, ontologyStateSvc.listItem.selected['@id'], this.newIRI);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, statement);
        });
        it('when getEntityUsages rejects', function() {
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject());
            ontologyStateSvc.onEdit(this.iriBegin, this.iriThen, this.iriEnd);
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalled();
        });
    });
    it('setCommonIriParts sets the proper values based on parameters', function() {
        ontologyStateSvc.setCommonIriParts('begin', 'then');
        expect(ontologyStateSvc.listItem.iriBegin).toEqual('begin');
        expect(ontologyStateSvc.listItem.iriThen).toEqual('then');
    });
    describe('setSelected should set the correct values and call the correct methods', function() {
        beforeEach(function() {
            this.id = 'id';
            this.object = {'@id': this.id};
            this.bnode = {'@id': '_:node0'};
            spyOn(ontologyStateSvc, 'setEntityUsages');
            // TODO: Remove this once these properties are in their own maps
            spyOn(ontologyStateSvc, 'updatePropertyIcon');

            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({});
            ontologyManagerSvc.getEntityAndBlankNodes.and.returnValue($q.when([this.object, this.bnode]));
    });
        it('if a falsy entityIRI is passed', function() {
            ontologyStateSvc.setSelected('', undefined, listItem)
                .then(_.noop, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(listItem.selected).toBeUndefined();
            expect(listItem.selectedBlankNodes).toEqual([]);
            expect(listItem.blankNodes).toEqual({});
            expect(ontologyManagerSvc.getEntityAndBlankNodes).not.toHaveBeenCalled();
        });
        it('when a spinner id is passed', function() {
            ontologyStateSvc.setSelected(this.id, false, listItem, 'spinner');
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, this.id, undefined, undefined, undefined, 'spinner');
            expect(listItem.selected).toEqual(this.object);
            expect(listItem.selectedBlankNodes).toEqual([this.bnode]);
            expect(listItem.blankNodes).toEqual({[this.bnode['@id']]: ''});
            expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(this.bnode['@id'], listItem.selectedBlankNodes, {[this.bnode['@id']]: {position: 0}});
            // TODO: Remove this once these properties are in their own maps
            expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(listItem.selected);

            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalledWith();
        });
        it('when getUsages is true and getActivePage object does not have a usages property', function() {
            ontologyStateSvc.setSelected(this.id, true, listItem);
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, this.id, undefined, undefined, undefined, '');
            expect(listItem.selected).toEqual(this.object);
            expect(listItem.selectedBlankNodes).toEqual([this.bnode]);
            expect(listItem.blankNodes).toEqual({[this.bnode['@id']]: ''});
            expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(this.bnode['@id'], listItem.selectedBlankNodes, {[this.bnode['@id']]: {position: 0}});
            // TODO: Remove this once these properties are in their own maps
            expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(listItem.selected);

            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(this.id);
        });
        it('when getUsages is false', function() {
            ontologyStateSvc.setSelected(this.id, false, listItem);
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, this.id, undefined, undefined, undefined, '');
            expect(listItem.selected).toEqual(this.object);
            expect(listItem.selectedBlankNodes).toEqual([this.bnode]);
            expect(listItem.blankNodes).toEqual({[this.bnode['@id']]: ''});
            expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(this.bnode['@id'], listItem.selectedBlankNodes, {[this.bnode['@id']]: {position: 0}});
            // TODO: Remove this once these properties are in their own maps
            expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(listItem.selected);

            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        it('when the entity is an individual', function() {
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            this.object['urn:prop'] = [{'@value': 'test'}];
            ontologyStateSvc.setSelected(this.id, false, listItem);
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, this.id, undefined, undefined, undefined, '');
            expect(listItem.selected).toEqual(this.object);
            expect(listItem.selected['urn:prop']).toEqual([{'@value': 'test', '@type': prefixes.xsd + 'string'}]);
            expect(listItem.selectedBlankNodes).toEqual([this.bnode]);
            expect(listItem.blankNodes).toEqual({[this.bnode['@id']]: ''});
            expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(this.bnode['@id'], listItem.selectedBlankNodes, {[this.bnode['@id']]: {position: 0}});
            // TODO: Remove this once these properties are in their own maps
            expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(listItem.selected);
            
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });
        // TODO: Remove this once these properties are in their own maps
        it('when the entity is imported', function() {
            listItem.importedOntologies = [{index: {[this.id]: {}}, ontologyId: 'imported'}];
            ontologyStateSvc.setSelected(this.id, false, listItem);
            scope.$apply();
            expect(ontologyManagerSvc.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, this.id, undefined, undefined, undefined, '');
            expect(listItem.selected).toEqual(Object.assign({}, this.object, {mobi: {imported: true, importedIRI: 'imported'}}));
            expect(listItem.selectedBlankNodes).toEqual([this.bnode]);
            expect(listItem.blankNodes).toEqual({[this.bnode['@id']]: ''});
            expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(this.bnode['@id'], listItem.selectedBlankNodes, {[this.bnode['@id']]: {position: 0}});
            expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(listItem.selected);
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
        });

    });
    describe('setEntityUsages should call the correct function', function() {
        beforeEach(function() {
            this.id = 'idx';
            this.key = 'project';
            this.activePage = {};
            this.httpId = 'usages-' + this.key + '-' + ontologyStateSvc.listItem.ontologyRecord.recordId;
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(this.activePage);
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue(this.key);
        });
        it('when getEntityUsages resolves', function() {
            var response = [{'@idx': 'this.id'}];
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.when(response));
            ontologyStateSvc.setEntityUsages(this.id);
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, this.id, 'select', this.httpId);
            expect(this.activePage.usages).toEqual(response);
        });
        it('when getEntityUsages rejects', function() {
            ontologyManagerSvc.getEntityUsages.and.returnValue($q.reject(this.error));
            ontologyStateSvc.setEntityUsages(this.id);
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.httpId);
            expect(ontologyManagerSvc.getEntityUsages).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, this.id, 'select', this.httpId);
            expect(this.activePage.usages).toEqual([]);
        });
    });
    describe('resetStateTabs should set the correct variables', function() {
        beforeEach(function() {
            this.newOntologyIRI = 'newId';
            ontologyStateSvc.listItem.editorTabStates = {
                classes: {entityIRI: 'id', usages: []},
                project: {entityIRI: 'id', preview: 'test'}
            };
            ontologyManagerSvc.getOntologyIRI.and.returnValue(this.newOntologyIRI);
            spyOn(ontologyStateSvc, 'setSelected').and.callFake(() => {
                ontologyStateSvc.listItem.selected = {'@id': 'id'};
                ontologyStateSvc.listItem.selectedBlankNodes = [{}];
                ontologyStateSvc.listItem.blankNodes = {bnode: 'bnode'};
            });
            spyOn(ontologyStateSvc, 'resetSearchTab');
            ontologyStateSvc.listItem.selected = {};
        });
        it('when getActiveKey is not project or search', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('classes');
            ontologyStateSvc.resetStateTabs();
            expect(ontologyStateSvc.resetSearchTab).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.classes).toEqual({open: {}, searchText: ''});
            expect(ontologyStateSvc.listItem.selected).toBeUndefined();
            expect(ontologyStateSvc.listItem.selectedBlankNodes).toEqual([]);
            expect(ontologyStateSvc.listItem.blankNodes).toEqual({});
            expect(ontologyStateSvc.setSelected).not.toHaveBeenCalled();
        });
        it('when getActiveKey is project', function() {
            spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('project');
            ontologyStateSvc.resetStateTabs();
            scope.$apply();
            expect(ontologyStateSvc.resetSearchTab).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.project).toEqual({entityIRI: this.newOntologyIRI, preview: ''});
            expect(ontologyStateSvc.listItem.selected).toEqual({'@id': 'id'});
            expect(ontologyStateSvc.listItem.selectedBlankNodes).toEqual([{}]);
            expect(ontologyStateSvc.listItem.blankNodes).toEqual({bnode: 'bnode'});
            expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newOntologyIRI, false, ontologyStateSvc.listItem, 'project');
        });
    });
    it('resetSearchTab should reset variables', function() {
        ontologyStateSvc.listItem.editorTabStates.search = {
            errorMessage: 'test',
            infoMessage: 'test',
            results: {test: 'a'},
            searchText: 'test',
            selected: {test: 'a'},
            highlightText: 'test'
        };
        ontologyStateSvc.resetSearchTab();
        expect(httpSvc.cancel).toHaveBeenCalledWith(ontologyStateSvc.listItem.editorTabStates.search.id);
        expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).toEqual('');
        expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('');
        expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual({});
        expect(ontologyStateSvc.listItem.editorTabStates.search.searchText).toEqual('');
        expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toEqual({});
        expect(ontologyStateSvc.listItem.editorTabStates.search.highlightText).toEqual('');
    });
    describe('getActiveKey', function() {
        it('defaults to "project"', function() {
            ontologyStateSvc.listItem.editorTabStates.tab.active = false;
            expect(ontologyStateSvc.getActiveKey()).toEqual('project');
        });
        it('returns the correct value', function() {
            expect(ontologyStateSvc.getActiveKey()).toEqual('tab');
        });
    });
    it('getActivePage gets the proper item', function() {
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('tab');
        expect(ontologyStateSvc.getActivePage()).toEqual(ontologyStateSvc.listItem.editorTabStates.tab);
    });
    describe('setActivePage sets the correct variables', function() {
        it('when state has the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
            ontologyStateSvc.setActivePage('other');
            expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.tab.active).toBe(false);
            expect(ontologyStateSvc.listItem.editorTabStates.other.active).toBe(true);
        });
        it('when state does not have the key', function() {
            spyOn(ontologyStateSvc, 'getActivePage');
            ontologyStateSvc.setActivePage('notThere');
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.tab.active).toBe(true);
            expect(ontologyStateSvc.listItem.editorTabStates.other.active).toBe(false);
        });
    });
    it('getActiveEntityIRI should return the proper value', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual('entityIRI');

        ontologyStateSvc.getActivePage.and.returnValue(ontologyStateSvc.listItem.editorTabStates.other);
        expect(ontologyStateSvc.getActiveEntityIRI()).toEqual(undefined);
    });
    describe('selectItem should call the proper functions', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
            spyOn(ontologyStateSvc, 'setEntityUsages');
            spyOn(ontologyStateSvc, 'setSelected').and.returnValue($q.when());
        });
        it('when entityIRI is undefined', function() {
            ontologyStateSvc.selectItem(undefined)
                .then(_.noop, () => {
                    fail('Promise should have resolved');
                })
            scope.$apply();
            expect(ontologyStateSvc.getActivePage).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
            expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(undefined, false, ontologyStateSvc.listItem, '');
        });
        describe('when entityIRI is defined', function() {
            beforeEach(function () {
                this.newId = 'newId';
            });
            it('and getUsages is true', function() {
                ontologyStateSvc.selectItem(this.newId, true)
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(this.newId);
                expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(this.newId);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newId, false, ontologyStateSvc.listItem, '');
            });
            it('and getUsages is false', function() {
                ontologyStateSvc.selectItem(this.newId, false)
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(this.newId);
                expect(ontologyStateSvc.setEntityUsages).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newId, false, ontologyStateSvc.listItem, '');
            });
            it('and spinnerId is provided', function() {
                ontologyStateSvc.selectItem(this.newId, undefined, 'id')
                .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.getActivePage).toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.editorTabStates.tab.entityIRI).toEqual(this.newId);
                expect(ontologyStateSvc.setEntityUsages).toHaveBeenCalledWith(this.newId);
                expect(ontologyStateSvc.setSelected).toHaveBeenCalledWith(this.newId, false, ontologyStateSvc.listItem, 'id');
            });
        });
    });
    it('unSelectItem sets all the variables appropriately', function() {
        spyOn(ontologyStateSvc, 'getActivePage').and.returnValue(ontologyStateSvc.listItem.editorTabStates.tab);
        ontologyStateSvc.unSelectItem();
        expect(ontologyStateSvc.listItem.selected).toBeUndefined();
        expect(ontologyStateSvc.listItem.selectedBlankNodes).toEqual([]);
        expect(ontologyStateSvc.listItem.blankNodes).toEqual({});
        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'entityIRI')).toBe(true);
        expect(!_.has(ontologyStateSvc.listItem.editorTabStates.tab, 'usages')).toBe(true);
    });
    describe('hasChanges returns the proper value', function() {
        it('when the listItem has additions', function() {
            expect(ontologyStateSvc.hasChanges({additions: ['test']})).toBe(true);
        });
        it('when the listItem has deletions', function() {
            expect(ontologyStateSvc.hasChanges({deletions: ['test']})).toBe(true);
        });
        it('when the listItem has neither additions nor deletions', function() {
            expect(ontologyStateSvc.hasChanges({})).toBe(false);
        });
    });
    describe('isCommittable returns the proper value', function() {
        it('when the listItem has additions', function() {
            expect(ontologyStateSvc.isCommittable({inProgressCommit: {additions: ['test']}})).toBe(true);
        });
        it('when the listItem has deletions', function() {
            expect(ontologyStateSvc.isCommittable({inProgressCommit: {deletions: ['test']}})).toBe(true);
        });
        it('when the listItem has neither additions nor deletions', function() {
            expect(ontologyStateSvc.isCommittable({})).toBe(false);
        });
    });
    it('should update the isSaved value', function() {
        spyOn(ontologyStateSvc, 'isCommittable').and.returnValue(true);
        ontologyStateSvc.updateIsSaved();
        expect(ontologyStateSvc.listItem.isSaved).toEqual(true);
        expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem);
    });
    describe('addEntityToHierarchy should add the entity to the proper maps', function() {
        it('where the parent entity has children', function() {
            ontologyStateSvc.addEntityToHierarchy(this.hierarchyInfo, 'new-node', 'node1a');
            expect(this.hierarchyInfo.parentMap['node1a']).toEqual(['node2a', 'node2b', 'node2c', 'new-node']);
            expect(this.hierarchyInfo.childMap['new-node']).toEqual(['node1a']);
        });
        it('where the parent does not have children', function() {
            ontologyStateSvc.addEntityToHierarchy(this.hierarchyInfo, 'new-node', 'node3c');
            expect(this.hierarchyInfo.parentMap['node3c']).toEqual(['new-node']);
            expect(this.hierarchyInfo.childMap['new-node']).toEqual(['node3c']);
        });
        it('unless the parent entity is not in the hierarchy', function() {
            var originalParentMap = angular.copy(this.hierarchyInfo.parentMap);
            var originalChildMap = angular.copy(this.hierarchyInfo.childMap);
            ontologyStateSvc.addEntityToHierarchy(this.hierarchyInfo, 'new-node', 'not-there');
            expect(this.hierarchyInfo.parentMap).toEqual(originalParentMap);
            expect(this.hierarchyInfo.childMap).toEqual(originalChildMap);
        });
    });
    it('deleteEntityFromParentInHierarchy should remove the provided entityIRI from the parentIRI', function() {
        ontologyStateSvc.deleteEntityFromParentInHierarchy(this.hierarchyInfo, 'node3a', 'node3b');
        expect(this.hierarchyInfo.parentMap['node3b']).toBeUndefined();
        expect(this.hierarchyInfo.childMap['node3a']).toEqual(['node2a', 'node2b']);
    });
    describe('deleteEntityFromHierarchy', function() {
        it('should delete the entity from the hierarchy tree', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(this.hierarchyInfo, 'node3a');
            expect(this.hierarchyInfo.parentMap['node2a']).toEqual(['node3c']);
            expect(this.hierarchyInfo.parentMap['node2b']).toBeUndefined();
            expect(this.hierarchyInfo.parentMap['node3b']).toBeUndefined();
            expect(this.hierarchyInfo.childMap['node3a']).toBeUndefined();
        });
        it('should move the children if required', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(this.hierarchyInfo, 'node2a');
            expect(this.hierarchyInfo.parentMap['node2a']).toBeUndefined();
            expect(this.hierarchyInfo.parentMap['node1a']).toEqual(['node2b', 'node2c']);
            expect(this.hierarchyInfo.childMap['node2a']).toBeUndefined();
            expect(this.hierarchyInfo.childMap['node3a']).toEqual(['node2b', 'node3b']);
            expect(this.hierarchyInfo.childMap['node3c']).toBeUndefined();
        });
    });
    it('getPathsTo should return all paths to provided node', function() {
        var expectedPaths = [
            ['node1a', 'node2a', 'node3a'],
            ['node1a', 'node2b', 'node3a'],
            ['node1a', 'node2c', 'node3b', 'node3a'],
            ['node1b', 'node3b', 'node3a']
        ];
        var result = ontologyStateSvc.getPathsTo(this.hierarchyInfo, 'node3a');
        expect(result.length).toBe(4);
        expect(_.sortBy(result)).toEqual(_.sortBy(expectedPaths));
    });
    describe('areParentsOpen should return', function() {
        beforeEach(function() {
            this.node = {
                indent: 1,
                entityIRI: 'iri',
                path: [this.recordId, 'otherIRI', 'andAnotherIRI', 'iri'],
                joinedPath: this.recordId + '.otherIRI.andAnotherIRI.iri'
            };
            this.tab = 'tab';
        });
        it('true when all parent paths are open', function() {
            ontologyStateSvc.listItem.editorTabStates[this.tab].open = {
                [this.node.joinedPath]: true,
                [this.recordId + '.otherIRI.andAnotherIRI']: true,
                [this.recordId + '.otherIRI']: true
            };
            expect(ontologyStateSvc.areParentsOpen(this.node, this.tab)).toBe(true);
        });
        it('false when only some parent paths are open', function() {
            ontologyStateSvc.listItem.editorTabStates[this.tab].open = {
                [this.node.joinedPath]: true,
                [this.recordId + '.otherIRI.andAnotherIRI']: true
            };
            expect(ontologyStateSvc.areParentsOpen(this.node, this.tab)).toBe(false);
        });
        it('false when all parent paths are not open', function() {
            expect(ontologyStateSvc.areParentsOpen(this.node, this.tab)).toBe(false);
        });
    });
    it('joinPath joins the provided array correctly', function() {
        expect(ontologyStateSvc.joinPath(['a', 'b', 'c'])).toBe('a.b.c');
    });
    describe('goTo calls the proper manager functions with correct parameters when it is', function() {
        beforeEach(function() {
            this.entity = {'@id': 'entityId'};
            this.node1 = {
                indent: 0,
                entityIRI: 'otherIri',
                hasChildren: true,
                path: ['recordId', 'otherIri']
            };
            this.node2 = {
                indent: 1,
                entityIRI: 'iri',
                hasChildren: false,
                path: ['recordId', 'otherIri', 'iri']
            };
            this.node3 = {
                indent: 0,
                entityIRI: 'anotherIri',
                hasChildren: false,
                path: ['recordId', 'antherIri']
            };
            spyOn(ontologyStateSvc, 'getEntityByRecordId').and.returnValue(this.entity);
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({entityIRI: '', vocabularySpinnerId: 'spinner'});
            spyOn(ontologyStateSvc, 'setActivePage');
            spyOn(ontologyStateSvc, 'selectItem');
            spyOn(ontologyStateSvc, 'openAt');
            spyOn(ontologyStateSvc, 'areParentsOpen').and.returnValue(true);
            spyOn(ontologyStateSvc, 'getDataPropertiesOpened').and.returnValue(true);
            spyOn(ontologyStateSvc, 'getObjectPropertiesOpened').and.returnValue(true);
            spyOn(ontologyStateSvc, 'getAnnotationPropertiesOpened').and.returnValue(true);

            ontologyStateSvc.listItem = {
                ontologyRecord: {},
                concepts: { flat: [this.node1, this.node2, this.node3] },
                conceptSchemes: { flat: [this.node1, this.node2, this.node3] },
                classes: {flat: [this.node1, this.node2, this.node3]},
                dataProperties: {
                    flat: [{
                        entityIRI: 'dataProp1',
                        hasChildren: true,
                        indent: 1,
                        get: ontologyStateSvc.getDataPropertiesOpened
                    }, {
                        entityIRI: 'dataProp2',
                        hasChildren: false,
                        indent: 2,
                        get: ontologyStateSvc.getDataPropertiesOpened
                    }]
                },
                objectProperties: {
                    flat: [{
                        entityIRI: 'objectProp1',
                        hasChildren: false,
                        indent: 1,
                        get: ontologyStateSvc.getObjectPropertiesOpened
                    }]
                },
                annotations: {
                    flat: [{
                        entityIRI: 'annotationProp1',
                        hasChildren: false,
                        indent: 1,
                        get: ontologyStateSvc.getAnnotationPropertiesOpened
                    }]
                },
                derivedConcepts: ['concept'],
                derivedConceptSchemes: ['scheme'],
                individuals: { flat: [this.node1, this.node2, this.node3] },
                editorTabStates: {
                    classes: {
                        index: 0
                    },
                    properties: {
                        index: 0
                    },
                    individuals: {
                        index: 0
                    },
                    concepts: {
                        index: 0
                    },
                    schemes: {
                        index: 0
                    }
                }
            };
        });
        it('an ontology', function() {
            ontologyManagerSvc.isOntology.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('project');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
        });
        it('a class', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('classes');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.classes.flat, 'iri');
            expect(ontologyStateSvc.listItem.editorTabStates.classes.index).toEqual(1);
        });
        it('a datatype property', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            spyOn(ontologyStateSvc, 'setDataPropertiesOpened');
            ontologyStateSvc.goTo('dataProp2');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('dataProp2', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataProperties.flat, 'dataProp2');
            expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
            expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(2);
        });
        describe('an object property', function() {
            it('with datatype properties in the ontology', function() {
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setObjectPropertiesOpened');
                ontologyStateSvc.goTo('objectProp1');
                expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('objectProp1', undefined, 'spinner');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.flat, 'objectProp1');
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(4)
            });
            it('with no datatype properties in the ontology', function() {
                ontologyStateSvc.listItem.dataProperties.flat = [];
                ontologyManagerSvc.isOntology.and.returnValue(false);
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                spyOn(ontologyStateSvc, 'setObjectPropertiesOpened');
                ontologyStateSvc.goTo('objectProp1');
                expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isAnnotation).not.toHaveBeenCalledWith(this.entity);
                expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('objectProp1', undefined, 'spinner');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectProperties.flat, 'objectProp1');
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(1)
            });
        });
        describe('an annotation property', function() {
            describe('with datatype properties in the ontology', function() {
                it('with object properties in the ontology', function() {
                    ontologyManagerSvc.isOntology.and.returnValue(false);
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    ontologyManagerSvc.isAnnotation.and.returnValue(true);
                    spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
                    ontologyStateSvc.goTo('annotationProp1');
                    expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                    expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                    expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 'spinner');
                    expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'annotationProp1');
                    expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(6)
                });
                it('with no object properties in the ontology', function() {
                    ontologyStateSvc.listItem.objectProperties.flat = [];
                    ontologyManagerSvc.isOntology.and.returnValue(false);
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    ontologyManagerSvc.isAnnotation.and.returnValue(true);
                    spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
                    ontologyStateSvc.goTo('annotationProp1');
                    expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                    expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                    expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 'spinner');
                    expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'annotationProp1');
                    expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(4)
                });
            });
            describe('with no datatype properties in the ontology', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.dataProperties.flat = [];
                });
                it('with object properties in the ontology', function() {
                    ontologyManagerSvc.isOntology.and.returnValue(false);
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    ontologyManagerSvc.isAnnotation.and.returnValue(true);
                    spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
                    ontologyStateSvc.goTo('annotationProp1');
                    expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                    expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                    expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 'spinner');
                    expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'annotationProp1');
                    expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(3)
                });
                it('with no object properties in the ontology', function() {
                    ontologyStateSvc.listItem.objectProperties.flat = [];
                    ontologyManagerSvc.isOntology.and.returnValue(false);
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    ontologyManagerSvc.isAnnotation.and.returnValue(true);
                    spyOn(ontologyStateSvc, 'setAnnotationPropertiesOpened');
                    ontologyStateSvc.goTo('annotationProp1');
                    expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
                    expect(ontologyManagerSvc.isConcept).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
                    expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
                    expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                    expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 'spinner');
                    expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.annotations.flat, 'annotationProp1');
                    expect(ontologyStateSvc.setAnnotationPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                    expect(ontologyStateSvc.listItem.editorTabStates.properties.index).toEqual(1)
                });
            });
        });
        it('a concept', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).not.toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.concepts.flat, 'iri');
            expect(ontologyStateSvc.listItem.editorTabStates.concepts.index).toEqual(1);
        });
        it('an conceptScheme', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('schemes');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptSchemes.flat, 'iri');
            expect(ontologyStateSvc.listItem.editorTabStates.schemes.index).toEqual(1);
        });
        it('an individual', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.individuals.flat, 'iri');
            expect(ontologyStateSvc.listItem.editorTabStates.individuals.index).toEqual(1);
        });
        it('an individual without the namedIndividualType', function() {
            ontologyManagerSvc.isOntology.and.returnValue(false);
            ontologyManagerSvc.isClass.and.returnValue(false);
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(false);
            ontologyStateSvc.goTo('iri');
            expect(ontologyManagerSvc.isOntology).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isClass).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(this.entity);
            expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConcepts);
            expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(this.entity, ontologyStateSvc.listItem.derivedConceptSchemes);
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, 'spinner');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.listItem.individuals.flat, 'iri');
            expect(ontologyStateSvc.listItem.editorTabStates.individuals.index).toEqual(1);
        });
    });
    it('openAt sets all parents open', function() {
        $document.querySelectorAll.and.returnValue([{offsetTop: 25}]);
        spyOn(ontologyStateSvc, 'getActiveKey').and.returnValue('tab');
        ontologyStateSvc.openAt([{
            entityIRI: 'iri-a',
            path: [this.recordId, 'iri-a'],
            joinedPath: this.recordId + '.iri-a'
        }, {
            entityIRI: 'iri-b',
            path: [this.recordId, 'iri-a', 'iri-b'],
            joinedPath: this.recordId + '.iri-a.iri-b'
        }, {
            entityIRI: 'iri-c',
            path: [this.recordId, 'iri-a', 'iri-b', 'iri-c'],
            joinedPath: this.recordId + '.iri-a.iri-b.iri-c'
        }], 'iri-c');
        expect(ontologyStateSvc.listItem.editorTabStates['tab'].open[this.recordId + '.iri-a']).toEqual(true);
        expect(ontologyStateSvc.listItem.editorTabStates['tab'].open[this.recordId + '.iri-a.iri-b']).toEqual(true);
    });
    describe('getDefaultPrefix returns the proper value for the prefix associated with ontology', function() {
        beforeEach(function() {
            ontologyManagerSvc.isBlankNodeId.and.callFake(id => _.isString(id) && (_.includes(id, '/.well-known/genid/') || _.includes(id, '_:genid') || _.includes(id, '_:b')));
            uuidSvc.v4.and.returnValue("test");
        });
        it('when there is no iriBegin or iriThen', function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId#';
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('ontologyId/#');
        });
        it('when there is a iriBegin and iriThen', function() {
            ontologyStateSvc.listItem = {
                iriBegin: 'begin#',
                iriThen: 'then'
            };
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('begin/then');
        });
        it('when the iri is a blank node and nothing is in the index', function() {
            ontologyStateSvc.listItem.ontologyId = 'https://mobi.com/.well-known/genid/genid1#';
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('https://mobi.com/blank-node-namespace/test#');
        });
        it('when the iri is a blank node and there is something in the index', function() {
            splitIRI.and.returnValue({begin: 'http://matonto.org/ontologies/uhtc', then: '#'});
            ontologyStateSvc.listItem.ontologyId = 'https://mobi.com/.well-known/genid/genid1#';
            ontologyStateSvc.listItem.index = {
                'http://matonto.org/ontologies/uhtc#Element': {
                    position: 0,
                    label: 'test',
                    ontologyIri: 'https://mobi.com/.well-known/genid/genid1#'
                }
            };
            expect(ontologyStateSvc.getDefaultPrefix()).toEqual('http://matonto.org/ontologies/uhtc#');
        });
    });
    describe('updatePropertyIcon should set the icon of an entity', function() {
        beforeEach(function() {
            this.entity = {};
            ontologyStateSvc.listItem.propertyIcons = {};
        });
        it('unless it is not a property', function() {
            ontologyManagerSvc.isProperty.and.returnValue(false);
            ontologyStateSvc.updatePropertyIcon(this.entity);
            expect(_.has(this.entity, 'mobi.icon')).toBe(false);
        });
        describe('if it is a property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isProperty.and.returnValue(true);
            });
            it('with more than one range', function() {
                this.entity[prefixes.rdfs + 'range'] = [{'@id': '1'}, {'@id': '2'}];
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-cubes');
            });
            it('with a range of xsd:string or rdf:langString', function() {
                this.tests = [prefixes.xsd + 'string', prefixes.rdf + 'langString'];
                _.forEach(this.tests, test => {
                    _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(this.entity);
                    expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-font');
                });
            });
            it('with a range of xsd:decimal, xsd:double, xsd:float, xsd:int, xsd:integer, xsd:long, or xsd:nonNegativeInteger', function() {
                var tests = [prefixes.xsd + 'decimal', prefixes.xsd + 'double', prefixes.xsd + 'float', prefixes.xsd + 'int', prefixes.xsd + 'integer', prefixes.xsd + 'long', prefixes.xsd + 'nonNegativeInteger'];
                _.forEach(tests, test => {
                    _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(this.entity);
                    expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-calculator');
                });
            });
            it('with a range of xsd:language', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'language');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-language');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'anyURI');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-external-link');
            });
            it('with a range of xsd:anyURI', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.xsd + 'dateTime');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-clock-o');
            });
            it('with a range of xsd:boolean or xsd:byte', function() {
                var tests = [prefixes.xsd + 'boolean', prefixes.xsd + 'byte'];
                _.forEach(tests, test => {
                    _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", test);
                    ontologyStateSvc.updatePropertyIcon(this.entity);
                    expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-signal');
                });
            });
            it('with a range of rdfs:Literal', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", prefixes.rdfs + 'Literal');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-cube');
            });
            it('with a range that is not predefined', function() {
                _.set(this.entity, "['" + prefixes.rdfs + "range'][0]['@id']", 'test');
                ontologyStateSvc.updatePropertyIcon(this.entity);
                expect(_.get(ontologyStateSvc.listItem.propertyIcons, [this.entity['@id']])).toBe('fa-link');
            });
        });
    });
    describe('uploadChanges should call the proper methods', function() {
        beforeEach(function() {
            ontologyStateSvc.list = [{ ontologyRecord: { recordId: this.recordId }, inProgressCommit: {  } }];
        });
        describe('when uploadChangesFile resolves', function() {
            beforeEach(function() {
                ontologyManagerSvc.uploadChangesFile.and.returnValue($q.when());
            });
            it('and getInProgressCommit resolves', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.when({ additions: ['a'], deletions: [] }));
                spyOn(ontologyStateSvc, 'updateOntology').and.returnValue($q.when());
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
            it ('and getInProgressCommit rejects', function() {
                catalogManagerSvc.getInProgressCommit.and.returnValue($q.reject(this.error));
                ontologyStateSvc.list[0].upToDate = true;
                ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
                scope.$apply();
                expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
                expect(catalogManagerSvc.getInProgressCommit).toHaveBeenCalledWith(this.recordId, this.catalogId);
            });
        });
        it('when uploadChangesFile rejects', function() {
            ontologyManagerSvc.uploadChangesFile.and.returnValue($q.reject(this.error));
            ontologyStateSvc.uploadChanges({}, this.recordId, this.branchId, this.commitId);
            scope.$apply();
            expect(ontologyManagerSvc.uploadChangesFile).toHaveBeenCalledWith({}, this.recordId, this.branchId, this.commitId);
            expect(catalogManagerSvc.getInProgressCommit).not.toHaveBeenCalled();
            expect(ontologyStateSvc.hasInProgressCommit(ontologyStateSvc.list[0])).toBe(false);
        });
    });
    describe('hasInProgressCommit returns the correct value', function() {
        it('when listItem.inProgressCommit is undefined.', function() {
            listItem.inProgressCommit = undefined;
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and deletions are undefined.', function() {
            listItem.inProgressCommit = {};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and/or deletions are defined but empty.', function() {
            listItem.inProgressCommit = {additions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
            listItem.inProgressCommit = {deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
            listItem.inProgressCommit = {additions: [], deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(false);
        });
        it('when additions and/or deletions are defined and not empty.', function() {
            listItem.inProgressCommit = {additions: ['a'], deletions: []};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
            listItem.inProgressCommit = {additions: [], deletions: ['b']};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
            listItem.inProgressCommit = {additions: ['a'], deletions: ['b']};
            expect(ontologyStateSvc.hasInProgressCommit(listItem)).toBe(true);
        });
    });
    describe('should add an IRI to classes.iris and update isVocabulary', function() {
        beforeEach(function () {
            this.iri = 'iri';
            this.listItem = {ontologyId: 'ontology', isVocabulary: false, classes: {iris: {}}};
            this.expectedIriObj = {};
        });
        it('unless the IRI is already in the list', function() {
            this.listItem.classes.iris[this.iri] = 'ontology';
            this.expectedIriObj[this.iri] = 'ontology';
            ontologyStateSvc.addToClassIRIs(this.listItem, this.iri);
            expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
        });
        describe('if the IRI does not exist in the list', function() {
            it('and IRI is skos:Concept', function() {
                this.iri = prefixes.skos + 'Concept';
                this.expectedIriObj[this.iri] = 'ontology';
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
            it('and IRI is skos:ConceptScheme', function() {
                this.iri = prefixes.skos + 'ConceptScheme';
                this.expectedIriObj[this.iri] = 'ontology';
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
            it('unless IRI is not skos:Concept', function() {
                this.expectedIriObj[this.iri] = 'ontology';
                ontologyStateSvc.addToClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
        });
    });
    describe('should remove an IRI from classes.iris and update isVocabulary', function() {
        beforeEach(function() {
            this.iri = 'iri';
            this.listItem = {ontologyId: 'ontology', isVocabulary: true, classes: {iris: {[this.iri]: 'ontology'}}};
            this.expectedIriObj = {};
        });
        describe('if IRI is skos:Concept and classIRIs', function() {
            beforeEach(function() {
                this.iri = prefixes.skos + 'Concept';
                this.listItem.classes.iris = {[this.iri]: 'ontology'};
                this.listItem.classes.iris[this.iri] = 'ontology';
            });
            it('has skos:ConceptScheme', function() {
                this.expectedIriObj[prefixes.skos + 'ConceptScheme'] = 'ontology';
                this.listItem.classes.iris[prefixes.skos + 'ConceptScheme'] = 'ontology';
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
            it('does not have skos:ConceptScheme', function() {
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
        });
        describe('if IRI is skos:ConceptScheme and classIRIs', function() {
            beforeEach(function() {
                this.iri = prefixes.skos + 'ConceptScheme';
                this.listItem.classes.iris = {[this.iri]: 'ontology'};
            });
            it('has skos:Concept', function() {
                this.expectedIriObj[prefixes.skos + 'Concept'] = 'ontology';
                this.listItem.classes.iris[prefixes.skos + 'Concept'] = 'ontology';
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(true);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
            it('does not have skos:Concept', function() {
                ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iri);
                expect(this.listItem.isVocabulary).toEqual(false);
                expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
            });
        });
        it('unless IRI is not skos:Concept', function () {
            ontologyStateSvc.removeFromClassIRIs(this.listItem, this.iri);
            expect(this.listItem.isVocabulary).toEqual(true);
            expect(this.listItem.classes.iris).toEqual(this.expectedIriObj);
        });
    });
    describe('addErrorToUploadItem should add the message to the correct message when', function() {
        beforeEach(function() {
            ontologyStateSvc.uploadList = [{id: 'id'}, {id: 'id2'}];
        });
        it('found', function() {
            ontologyStateSvc.addErrorToUploadItem('id2', 'error');
            expect(ontologyStateSvc.uploadList).toEqual([{id: 'id'}, {id: 'id2', error: 'error'}]);
        });
        it('not found', function() {
            ontologyStateSvc.addErrorToUploadItem('missing', 'error');
            expect(ontologyStateSvc.uploadList).toEqual([{id: 'id'}, {id: 'id2'}]);
        });
    });
    describe('attemptMerge should return correctly if checkConflicts', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'checkConflicts').and.returnValue($q.when());
        });
        describe('resolves and merge', function() {
            beforeEach(function() {
                spyOn(ontologyStateSvc, 'merge').and.returnValue($q.when());
            });
            it('resolves', function() {
                ontologyStateSvc.attemptMerge()
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
                expect(ontologyStateSvc.merge).toHaveBeenCalled();
            });
            it('rejects', function() {
                ontologyStateSvc.merge.and.returnValue($q.reject('Error'));
                ontologyStateSvc.attemptMerge()
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toEqual('Error');
                    });
                scope.$apply();
                expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
                expect(ontologyStateSvc.merge).toHaveBeenCalled();
            });
        });
        it('rejects', function() {
            ontologyStateSvc.checkConflicts.and.returnValue($q.reject('Error'));
            ontologyStateSvc.attemptMerge()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(ontologyStateSvc.checkConflicts).toHaveBeenCalled();
        });
    });
    describe('checkConflicts correctly returns and set variables correctly if getBranchConflicts', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.merge = {
                target: {'@id': this.branchId},
                conflicts: []
            };
        });
        describe('resolves with', function() {
            it('an empty array', function() {
                ontologyStateSvc.checkConflicts()
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId);
                expect(ontologyStateSvc.listItem.merge.conflicts).toEqual([]);
            });
            it('conflicts', function() {
                catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([{}]));
                ontologyStateSvc.checkConflicts()
                    .then(() => {
                        fail('Promise should have rejected');
                    }, response => {
                        expect(response).toBeUndefined();
                    });
                scope.$apply();
                expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId);
                expect(ontologyStateSvc.listItem.merge.conflicts).toEqual([{resolved: false}]);
            });
        });
        it('rejects', function() {
            catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject('Error'));
            ontologyStateSvc.checkConflicts()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId);
            expect(ontologyStateSvc.listItem.merge.conflicts).toEqual([]);
        });
    });
    describe('merge should correctly return and call the correct methods if mergeBranches', function() {
        beforeEach(function() {
            catalogManagerSvc.mergeBranches.and.returnValue($q.when(this.commitId));
            spyOn(ontologyStateSvc, 'removeBranch').and.returnValue($q.when());
            spyOn(ontologyStateSvc, 'deleteOntologyBranchState').and.returnValue($q.when());
            spyOn(ontologyStateSvc, 'updateOntology').and.returnValue($q.when());
            ontologyStateSvc.listItem.merge = {
                target: {'@id': this.branchId},
                checkbox: true,
                resolutions: {
                    additions: [],
                    deletions: []
                }
            };
        });
        describe('resolves and the merge checkbox is', function() {
            describe('true and deleteOntologyBranch', function() {
                describe('resolves and removeBranch', function() {
                    describe('resolves and deleteOntologyBranchState', function() {
                        describe('resolves and updateOntology', function() {
                            it('resolves', function() {
                                ontologyStateSvc.merge()
                                .then(_.noop, () => {
                                    fail('Promise should have resolved');
                                });
                                scope.$apply();
                                expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                                expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.deleteOntologyBranchState).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            });
                            it('rejects', function() {
                                ontologyStateSvc.updateOntology.and.returnValue($q.reject('Error'));
                                ontologyStateSvc.merge()
                                    .then(() => {
                                        fail('Promise should have rejected');
                                    }, response => {
                                        expect(response).toEqual('Error');
                                    });
                                scope.$apply();
                                expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                                expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.deleteOntologyBranchState).toHaveBeenCalledWith(this.recordId, this.branchId);
                                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                            });
                        });
                        it('rejects', function() {
                            ontologyStateSvc.deleteOntologyBranchState.and.returnValue($q.reject('Error'));
                            ontologyStateSvc.merge()
                                .then(() => {
                                    fail('Promise should have rejected');
                                }, response => {
                                    expect(response).toEqual('Error');
                                });
                            scope.$apply();
                            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                            expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                            expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                            expect(ontologyStateSvc.deleteOntologyBranchState).toHaveBeenCalledWith(this.recordId, this.branchId);
                            expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                        });
                    });
                    it('rejects', function() {
                        ontologyStateSvc.removeBranch.and.returnValue($q.reject('Error'));
                        ontologyStateSvc.merge()
                            .then(() => {
                                fail('Promise should have rejected');
                            }, response => {
                                expect(response).toEqual('Error');
                            });
                        scope.$apply();
                        expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                        expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.removeBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                        expect(ontologyStateSvc.deleteOntologyBranchState).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                    });
                });
                it('rejects', function() {
                    ontologyManagerSvc.deleteOntologyBranch.and.returnValue($q.reject('Error'));
                    ontologyStateSvc.merge()
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                    expect(ontologyManagerSvc.deleteOntologyBranch).toHaveBeenCalledWith(this.recordId, this.branchId);
                    expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.deleteOntologyBranchState).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                });
            });
            describe('false and updateOntology', function() {
                beforeEach(function() {                    
                    ontologyStateSvc.listItem.merge.checkbox = false;
                });
                it('resolves', function() {
                    ontologyStateSvc.merge()
                        .then(_.noop, () => {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                    expect(ontologyManagerSvc.deleteOntologyBranch).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.deleteOntologyBranchState).not.toHaveBeenCalled();
                });
                it('rejects', function() {
                    ontologyStateSvc.updateOntology.and.returnValue($q.reject('Error'));
                    ontologyStateSvc.merge()
                        .then(() => {
                            fail('Promise should have rejected');
                        }, response => {
                            expect(response).toEqual('Error');
                        });
                    scope.$apply();
                    expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
                    expect(ontologyManagerSvc.deleteOntologyBranch).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.deleteOntologyBranchState).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId);
                });
            });
        });
        it('rejects', function() {
            catalogManagerSvc.mergeBranches.and.returnValue($q.reject('Error'));
            ontologyStateSvc.merge()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith(this.branchId, this.branchId, this.recordId, this.catalogId, ontologyStateSvc.listItem.merge.resolutions);
            expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.deleteOntologyBranch).not.toHaveBeenCalled();
            expect(ontologyStateSvc.removeBranch).not.toHaveBeenCalled();
            expect(ontologyStateSvc.deleteOntologyBranchState).not.toHaveBeenCalled();
        });
    });
    it('cancelMerge should set the appropriate variables to reset a merge', function() {
        ontologyStateSvc.listItem.merge = {
            active: true,
            target: {'@id': this.branchId},
            checkbox: true,
            difference: {},
            conflicts: [{}],
            resolutions: {
                additions: [{}],
                deletions: [{}]
            }
        }
        ontologyStateSvc.cancelMerge();
        expect(ontologyStateSvc.listItem.merge).toEqual({
            active: false,
            target: undefined,
            checkbox: false,
            difference: undefined,
            conflicts: [],
            resolutions: {
                additions: [],
                deletions: []
            }
        });
    });
    describe('canModify should determine whether the current user can modify the ontology', function() {
        it('if a commit is checked out', function() {
            ontologyStateSvc.listItem.ontologyRecord.branchId = '';
            expect(ontologyStateSvc.canModify()).toEqual(false);
        });
        it('if the master branch is checked out', function() {
            ontologyStateSvc.listItem.userCanModifyMaster = true;
            ontologyStateSvc.listItem.ontologyRecord.branchId = 'branch';
            ontologyStateSvc.listItem.masterBranchIRI = 'branch';
            expect(ontologyStateSvc.canModify()).toEqual(true);
        });
        it('if another branch is checked out', function() {
            ontologyStateSvc.listItem.userCanModify = true;
            ontologyStateSvc.listItem.ontologyRecord.branchId = 'branch';
            ontologyStateSvc.listItem.masterBranchIRI = 'master';
            expect(ontologyStateSvc.canModify()).toEqual(true);
        });
    });
    describe('handleDeletedClass should add the entity to the proper maps', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.noDomainProperties = [];
            ontologyStateSvc.listItem.propertyIcons = {
                'iri1': 'icon',
                'iri2': 'icon',
                'iri3': 'icon'
            };
            ontologyStateSvc.listItem.classToChildProperties = {
                'class1': ['iri1', 'iri2'],
                'class2': ['iri2', 'iri4'],
                'class3': ['iri3', 'iri4']
            };
        });
        it('when the property has no domains', function() {
            ontologyStateSvc.handleDeletedClass('class1');
            expect(ontologyStateSvc.listItem.noDomainProperties).toEqual(['iri1']);
        });
        it('when the property has a domain', function() {
            ontologyStateSvc.handleDeletedClass('class2');
            expect(ontologyStateSvc.listItem.noDomainProperties).toEqual([]);
        });
    });
    it('handleDeletedProperties should add the entity to the proper maps', function() {
        this.property = {
            '@id': 'iri1',
            "rdfs:domain": [{'@id': "class1"}]
        }
        ontologyStateSvc.listItem.classToChildProperties = {
            'class1': ['iri1', 'iri2'],
            'class2': ['iri2', 'iri5'],
            'class3': ['iri3', 'iri4']
        };
        ontologyStateSvc.handleDeletedProperty(this.property);
        expect(ontologyStateSvc.listItem.classToChildProperties['class1']).toEqual(['iri2']);
    });
    describe('handleNewProperty should add the entity to the proper maps', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.noDomainProperties = [];
            ontologyStateSvc.listItem.classToChildProperties = {
                'class1': [],
                'class2': ['iri2', 'iri5'],
                'class3': ['iri3', 'iri4']
            };
        });
        it('when the property has domains', function() {
            this.property = {
                '@id': 'iri1',
                "rdfs:domain": [{'@id': "class1"}]
            }
            ontologyStateSvc.handleNewProperty(this.property);
            expect(ontologyStateSvc.listItem.classToChildProperties['class1']).toEqual(['iri1']);
        });
        it('when the property has no domain', function() {
            this.property = {
                '@id': 'iri1',
            }
            ontologyStateSvc.handleNewProperty(this.property);
            expect(ontologyStateSvc.listItem.noDomainProperties).toEqual(['iri1']);
        });
    });
    it('addPropertyToClasses should add the entity to the proper maps', function() {
        ontologyStateSvc.listItem.noDomainProperties = [];
        ontologyStateSvc.listItem.classToChildProperties = {
            'class1': ['iri1', 'iri2'],
            'class2': ['iri2', 'iri5'],
            'class3': ['iri3', 'iri4']
        };
        ontologyStateSvc.addPropertyToClasses('iri1', ['class2']);
        expect(ontologyStateSvc.listItem.classToChildProperties['class2']).toEqual(['iri2','iri5','iri1']);
    });
    describe('removePropertyFromClass should add the entity to the proper maps', function() {
        beforeEach(function() {
            this.property = {
                '@id': 'iri1',
            }
            ontologyStateSvc.listItem.noDomainProperties = [];
            ontologyStateSvc.listItem.classToChildProperties = {
                'class1': ['iri1', 'iri2'],
                'class2': ['iri2', 'iri5'],
                'class3': ['iri3', 'iri4']
            };
        });
        it('when the property has no domains', function() {
            ontologyStateSvc.removePropertyFromClass(this.property, 'class1');
            expect(ontologyStateSvc.listItem.classToChildProperties['class1']).toEqual(['iri2']);
            expect(ontologyStateSvc.listItem.noDomainProperties).toEqual(['iri1']);
        });
        it('when the property has a domain', function() {
            this.property = {
                '@id': 'iri1',
                "rdfs:domain": [{'@id': "class1"}, {'@id': "class2"}]
            }
            ontologyStateSvc.removePropertyFromClass(this.property, 'class2');
            expect(ontologyStateSvc.listItem.noDomainProperties).toEqual([]);
        });
    });
});