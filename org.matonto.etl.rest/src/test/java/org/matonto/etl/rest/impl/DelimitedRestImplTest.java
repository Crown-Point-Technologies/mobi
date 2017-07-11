package org.matonto.etl.rest.impl;

/*-
 * #%L
 * org.matonto.etl.rest
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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.ontology.dataset.Dataset;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.etl.api.delimited.MappingId;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.Model;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class DelimitedRestImplTest extends MatontoRestTestNg {
    private DelimitedRestImpl rest;
    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;
    private static final String MAPPING_RECORD_IRI = "http://test.org/mapping-record";
    private static final String DATASET_RECORD_IRI = "http://test.org/dataset-record";
    private static final String DATASET_IRI = "http://test.org/dataset";
    private static final String NAMED_GRAPH_IRI = "http://test.org/named-graph";
    private static final String REPOSITORY_ID = "test";
    private static final String ERROR_IRI = "http://error.org";

    @Mock
    private DelimitedConverter converter;

    @Mock
    private MappingManager mappingManager;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private DatasetRecord datasetRecord;

    @Mock
    private Dataset dataset;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        MockitoAnnotations.initMocks(this);
        rest = new DelimitedRestImpl();
        rest.setDelimitedConverter(converter);
        rest.setMappingManager(mappingManager);
        rest.setDatasetManager(datasetManager);
        rest.setRepositoryManager(repositoryManager);
        rest.setVf(vf);
        rest.setTransformer(transformer);
        rest.start();

        when(transformer.matontoModel(any(Model.class)))
                .thenAnswer(i -> Values.matontoModel((Model) i.getArguments()[0]));
        when(transformer.sesameModel(any(org.matonto.rdf.api.Model.class)))
                .thenAnswer(i -> Values.sesameModel((org.matonto.rdf.api.Model) i.getArguments()[0]));
        when(mappingWrapper.getModel()).thenReturn(mf.createModel());
        when(datasetManager.getDatasetRecord(any(Resource.class))).thenReturn(Optional.empty());
        when(datasetManager.getDatasetRecord(vf.createIRI(DATASET_RECORD_IRI))).thenReturn(Optional.of(datasetRecord));
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        when(repositoryManager.getRepository(REPOSITORY_ID)).thenReturn(Optional.of(repo));
        when(mappingManager.retrieveMapping(any(Resource.class))).thenReturn(Optional.empty());
        when(mappingManager.retrieveMapping(vf.createIRI(MAPPING_RECORD_IRI))).thenReturn(Optional.of(mappingWrapper));
        when(mappingManager.createMappingId(any(IRI.class))).thenAnswer(i -> new MappingId() {
            @Override
            public Optional<IRI> getMappingIRI() {
                return null;
            }

            @Override
            public Optional<IRI> getVersionIRI() {
                return null;
            }

            @Override
            public Resource getMappingIdentifier() {
                return vf.createIRI(i.getArguments()[0].toString());
            }
        });

        return new ResourceConfig()
            .register(rest)
            .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() throws Exception {
        RepositoryConnection conn = repo.getConnection();
        conn.clear();
        conn.add(vf.createIRI(DATASET_IRI), vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), vf.createIRI(NAMED_GRAPH_IRI));
        conn.close();
        reset(dataset, datasetRecord, converter);

        when(dataset.getResource()).thenReturn(vf.createIRI(DATASET_IRI));
        when(datasetRecord.getResource()).thenReturn(vf.createIRI(DATASET_RECORD_IRI));
        when(datasetRecord.getDataset_resource()).thenReturn(Optional.of(vf.createIRI(DATASET_IRI)));
        when(datasetRecord.getRepository()).thenReturn(Optional.of(REPOSITORY_ID));
        when(converter.convert(any(SVConfig.class))).thenReturn(mf.createModel());
        when(converter.convert(any(ExcelConfig.class))).thenReturn(mf.createModel());
    }

    @Test
    public void uploadDelimitedTest() {
        FormDataMultiPart fd;
        Response response;
        String[] files = {
                "test.csv", "test.xls", "test.xlsx"
        };
        for (String file : files) {
            fd = getFileFormData(file);
            response = target().path("delimited-files").request().post(Entity.entity(fd,
                    MediaType.MULTIPART_FORM_DATA));
            String filename = response.readEntity(String.class);

            assertEquals(response.getStatus(), 201);
            assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + filename)));
        }
    }

    @Test
    public void updateNonexistentDelimitedTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));
    }

    @Test
    public void updateDelimitedReplacesContentTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_updated.csv");

        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), fileName);
        List<String> resultLines = Files.readAllLines(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName));
        assertEquals(resultLines.size(), expectedLines.size());
        for (int i = 0; i < resultLines.size(); i++) {
            assertEquals(resultLines.get(i), expectedLines.get(i));
        }
    }

    @Test
    public void getRowsFromCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test.csv");
        Response response = target().path("delimited-files/" + fileName).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromCsvWithParamsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_tabs.csv");

        int rowNum = 5;
        Response response = target().path("delimited-files/" + fileName).queryParam("rowCount", rowNum)
                .queryParam("separator", "\t").request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void nonExistentRowsTest() {
        Response response = target().path("delimited-files/error").request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getRowsFromExcelWithDefaultsTest() throws Exception {
        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("delimited-files/" + fileName1).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("delimited-files/" + fileName2).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromExcelWithFormulasTest() throws Exception {
        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("formulaData.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("formulaData.xls");
        Response response = target().path("delimited-files/" + fileName1).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 9);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("formulaData.xlsx", fileName2);
        expectedLines = getExcelResourceLines("formulaData.xlsx");
        response = target().path("delimited-files/" + fileName2).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 9);
    }

    @Test
    public void getRowsFromExcelWithParamsTest() throws Exception {
        int rowNum = 5;

        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("delimited-files/" + fileName1).queryParam("rowCount", rowNum).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("delimited-files/" + fileName2).queryParam("rowCount", rowNum).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void mapWithoutMappingTest() {
        String mapping = "";
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingIRI", mapping)
                .request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapWithNonExistentMappingTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingIRI", ERROR_IRI)
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, null);
        isJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(fileName));
    }

    @Test
    public void mapCsvWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        params.put("fileName", "test");
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        isNotJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(params.get("fileName").toString()));
    }

    @Test
    public void mapExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, null);
        isJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(fileName));
    }

    @Test
    public void mapExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("fileName", "test");
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        isNotJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(params.get("fileName").toString()));
    }

    @Test
    public void mapNonexistentDelimitedTest() {
        Response response = target().path("delimited-files/error/map").queryParam("mappingIRI", MAPPING_RECORD_IRI)
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapDeletesFile() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));

        testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        assertFalse(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));
    }

    @Test
    public void mapPreviewWithoutMappingTest() {
        String mapping = "";
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mapping);
        Response response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(null,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapPreviewCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewCsvWithParamsTest() throws Exception{
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewNonexistentDelimitedTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", "[]");
        Response response = target().path("delimited-files/error/map-preview").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithoutMappingTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", "")
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").queryParam("datasetRecordIRI", DATASET_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithoutDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", "").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoNonexistentDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", ERROR_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithNonexistentMappingTest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", ERROR_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetThatIsNotSetTest() throws Exception {
        // Setup:
        when(datasetRecord.getDataset_resource()).thenReturn(Optional.empty());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void mapIntoDatasetWithMissingRepositoryTest() throws Exception {
        // Setup:
        when(datasetRecord.getRepository()).thenReturn(Optional.empty());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void mapIntoDatasetWithUnavailableRepositoryTest() throws Exception {
        // Setup:
        when(datasetRecord.getRepository()).thenReturn(Optional.of("error"));
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithNoSystemNamedGraphTest() throws Exception {
        // Setup:
        when(datasetRecord.getDataset_resource()).thenReturn(Optional.of(vf.createIRI(ERROR_IRI)));
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void mapCSVIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        org.matonto.rdf.api.Model model = mf.createModel(Collections.singleton(data));
        when(converter.convert(any(SVConfig.class))).thenReturn(model);
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(data.getSubject(), data.getPredicate(), data.getObject(), vf.createIRI(NAMED_GRAPH_IRI)).hasNext());
        conn.close();
    }

    @Test
    public void mapExcelIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        org.matonto.rdf.api.Model model = mf.createModel(Collections.singleton(data));
        when(converter.convert(any(ExcelConfig.class))).thenReturn(model);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(data.getSubject(), data.getPredicate(), data.getObject(), vf.createIRI(NAMED_GRAPH_IRI)).hasNext());
        conn.close();
    }

    private void isJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void isNotJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
            fail();
        } catch (Exception e) {
            System.out.println("Format is not JSON-LD, as expected");
        }
    }

    private Response testMapPreview(String fileName, String jsonld, Map<String, Object> params) {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);
        WebTarget wt = target().path("delimited-files/" + fileName + "/map-preview");
        if (params != null) {
            for (String k : params.keySet()) {
                wt = wt.queryParam(k, params.get(k));
            }
        }
        Response response = wt.request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        return response;
    }

    private Response testMapDownload(String fileName, String mappingName, Map<String, Object> params) {
        WebTarget wt = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", mappingName);
        if (params != null) {
            for (String k : params.keySet()) {
                wt = wt.queryParam(k, params.get(k));
            }
        }
        Response response = wt.request().get();
        assertEquals(response.getStatus(), 200);
        return response;
    }

    private void testResultsRows(Response response, List<String> expectedLines, int rowNum) {
        String body = response.readEntity(String.class);
        JSONArray lines = JSONArray.fromObject(body);
        assertEquals(lines.size(), rowNum + 1);
        for (int i = 0; i < lines.size(); i++) {
            JSONArray line = lines.getJSONArray(i);
            String expectedLine = expectedLines.get(i);
            for (Object item : line) {
                assertTrue(expectedLine.contains(item.toString()));
            }
        }
    }

    private List<String> getCsvResourceLines(String fileName) throws Exception {
        return IOUtils.readLines(getClass().getClassLoader().getResourceAsStream(fileName));
    }

    private List<String> getExcelResourceLines(String fileName) {
        List<String> expectedLines = new ArrayList<>();
        try {
            Workbook wb = WorkbookFactory.create(getClass().getResourceAsStream("/" + fileName));
            FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            int index = 0;
            for (Row row : sheet) {
                String rowStr = "";
                for (Cell cell : row) {
                    rowStr += df.formatCellValue(cell, evaluator);
                }
                expectedLines.add(index, rowStr);
                index++;
            }
        } catch (IOException | InvalidFormatException e) {
            e.printStackTrace();
        }
        return expectedLines;
    }

    private FormDataMultiPart getFileFormData(String resourceName) {
        FormDataMultiPart fd = new FormDataMultiPart();
        InputStream content = getClass().getResourceAsStream("/" + resourceName);
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("delimitedFile").fileName(resourceName).build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        return fd;
    }

    private void copyResourceToTemp(String resourceName, String newName) throws IOException {
        Files.copy(getClass().getResourceAsStream("/" + resourceName),
                Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + newName), StandardCopyOption.REPLACE_EXISTING);
    }
}
