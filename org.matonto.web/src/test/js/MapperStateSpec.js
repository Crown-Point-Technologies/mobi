describe('Mapper State service', function() {
    var $httpBackend,
        mapperStateSvc;

    mockPrefixes();
    beforeEach(function() {
        module('mapperState');
        mockMappingManager();
        mockOntologyManager();
        mockCsvManager();

        inject(function(mapperStateService, _ontologyManagerService_, _mappingManagerService_, _csvManagerService_) {
            mapperStateSvc = mapperStateService;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            csvManagerSvc = _csvManagerService_;
        });

        mappingManagerSvc.mapping = {jsonld: [], name: 'mapping'};
    });

    it('should initialize important variables', function() {
        mapperStateSvc.initialize();
        expect(mapperStateSvc.editMapping).toBe(false);
        expect(mapperStateSvc.newMapping).toBe(false);
        expect(mapperStateSvc.step).toBe(0);
        expect(mapperStateSvc.invalidProps).toEqual([]);
        expect(mapperStateSvc.availableColumns).toEqual([]);
        expect(mapperStateSvc.availableProps).toEqual([]);
        expect(mapperStateSvc.openedClasses).toEqual([]);
    });
    it('should reset edit related variables', function() {
        mapperStateSvc.resetEdit();
        expect(mapperStateSvc.selectedClassMappingId).toBe('');
        expect(mapperStateSvc.selectedPropMappingId).toBe('');
        expect(mapperStateSvc.selectedColumn).toBe('');
        expect(mapperStateSvc.newProp).toBe(false);
        expect(mapperStateSvc.selectedProp).toEqual(undefined);
    });
    it('should set all variables for creating a new mapping', function() {
        spyOn(mapperStateSvc, 'resetEdit');
        mapperStateSvc.createMapping();
        expect(mapperStateSvc.editMapping).toBe(true);
        expect(mapperStateSvc.newMapping).toBe(true);
        expect(mapperStateSvc.step).toBe(0);
        expect(mappingManagerSvc.mapping).toEqual({jsonld: [], name: ''});
        expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        expect(mapperStateSvc.editMappingName).toBe(true);
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
    });
    it('should get the cached source ontology values', function() {
        var result = mapperStateSvc.getCachedSourceOntologyId();
        expect(typeof result).toBe('string');
        result = mapperStateSvc.getCachedSourceOntologies();
        expect(result).toBe(undefined);
    });
    it('should cache the source ontology values from the current mapping', function() {
        mappingManagerSvc.getSourceOntologyId.and.returnValue('test');
        mappingManagerSvc.sourceOntologies = [{}];
        mapperStateSvc.cacheSourceOntologies();
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('test');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(mappingManagerSvc.sourceOntologies);
    });
    it('should clear the cached source ontology values', function() {
        mapperStateSvc.clearCachedSourceOntologies();
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(undefined);
    });
    it('should restore the cached source ontology values to the current mapping', function() {
        var ontologyId = mapperStateSvc.getCachedSourceOntologyId();
        var ontologies = mapperStateSvc.getCachedSourceOntologies();
        mapperStateSvc.restoreCachedSourceOntologies();
        expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, ontologyId);
        expect(mappingManagerSvc.sourceOntologies).toEqual(ontologies);
        expect(mapperStateSvc.getCachedSourceOntologyId()).toBe('');
        expect(mapperStateSvc.getCachedSourceOntologies()).toEqual(undefined);
    });
    it('should return a list of all the mapped column headers', function() {
        var dataMappings = [{'columnIndex': [{'@value': '0'}], index: 0}];
        mappingManagerSvc.getAllDataMappings.and.returnValue(dataMappings);
        csvManagerSvc.filePreview = {headers: ['test']};
        var results = mapperStateSvc.getMappedColumns();
        expect(_.isArray(results)).toBe(true);
        expect(results.length).toBe(dataMappings.length);
        _.forEach(results, function(result, idx) {
            expect(result).toBe(csvManagerSvc.filePreview.headers[dataMappings[idx].index]);
        });
    });
    it('should update availableColumns depending on whether a property mapping has been selected', function() {
        spyOn(mapperStateSvc, 'getMappedColumns').and.returnValue(['test1'])
        csvManagerSvc.filePreview = {headers: ['test1', 'test2']};
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).not.toContain('test1');
        expect(mapperStateSvc.availableColumns).toContain('test2');

        mapperStateSvc.selectedPropMappingId = 'prop'
        mappingManagerSvc.mapping.jsonld = [{'@id': 'prop', 'columnIndex': [{'@value': '0'}]}];
        mapperStateSvc.updateAvailableColumns();
        expect(mapperStateSvc.availableColumns).toContain('test1');
        expect(mapperStateSvc.availableColumns).toContain('test2');
    });
    it('should update availableProps', function() {
        var classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([{'hasProperty': [classProps[0]]}]);
        ontologyManagerSvc.getClassProperties.and.returnValue(classProps);
        mapperStateSvc.updateAvailableProps();
        expect(mapperStateSvc.availableProps).not.toContain(classProps[0]);
        expect(mapperStateSvc.availableProps).toContain(classProps[1]);
    });
    it('should change the mapping name if editing a previous mapping', function() {
        var name = mappingManagerSvc.mapping.name;
        mapperStateSvc.newMapping = true;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).toBe(name);

        mapperStateSvc.newMapping = false;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).not.toBe(name);

        var newName = mappingManagerSvc.mapping.name;
        mapperStateSvc.changedMapping();
        expect(mappingManagerSvc.mapping.name).toBe(newName);
    });
});