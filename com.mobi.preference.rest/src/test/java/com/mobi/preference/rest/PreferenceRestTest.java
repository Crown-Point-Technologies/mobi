//package com.mobi.preference.rest;

/*-
 * #%L
 * com.mobi.preference.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
//
//import com.mobi.exception.MobiException;
//import com.mobi.ontologies.provo.Activity;
//import com.mobi.ontologies.provo.Entity;
//import com.mobi.persistence.utils.api.SesameTransformer;
//import com.mobi.preference.api.PreferenceService;
//import com.mobi.rdf.api.Resource;
//import com.mobi.rdf.api.Statement;
//import com.mobi.rdf.api.ValueFactory;
//import com.mobi.rdf.core.utils.Values;
//import com.mobi.rdf.orm.OrmFactory;
//import com.mobi.repository.api.Repository;
//import com.mobi.repository.api.RepositoryConnection;
//import com.mobi.repository.api.RepositoryManager;
//import com.mobi.rest.util.MobiRestTestNg;
//import com.mobi.rest.util.UsernameTestFilter;
//import net.sf.json.JSONArray;
//import net.sf.json.JSONObject;
//import org.apache.commons.io.IOUtils;
//import org.eclipse.rdf4j.model.Model;
//import org.eclipse.rdf4j.repository.sail.SailRepository;
//import org.eclipse.rdf4j.rio.RDFFormat;
//import org.eclipse.rdf4j.rio.Rio;
//import org.eclipse.rdf4j.sail.memory.MemoryStore;
//import org.glassfish.jersey.client.ClientConfig;
//import org.glassfish.jersey.media.multipart.MultiPartFeature;
//import org.glassfish.jersey.server.ResourceConfig;
//import org.junit.Test;
//import org.mockito.Mock;
//
//import java.io.ByteArrayInputStream;
//import java.nio.charset.StandardCharsets;
//import java.util.ArrayList;
//import java.util.Collections;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//import java.util.Set;
//import java.util.stream.Collectors;
//import java.util.stream.IntStream;
//import java.util.stream.Stream;
//import javax.ws.rs.core.Application;
//import javax.ws.rs.core.Link;
//import javax.ws.rs.core.MultivaluedMap;
//import javax.ws.rs.core.Response;
//
//public class PreferenceRestTest extends MobiRestTestNg {
//
//    private PreferenceRest rest;
//
//    private ValueFactory vf;
//    private OrmFactory<Activity> activityFactory;
//    private OrmFactory<Entity> entityFactory;
//    private Repository repo;
//
//    private String provData;
//    private List<String> activityIRIs;
//    private List<String> entityIRIs;
//    private final String ACTIVITY_NAMESPACE = "http://test.org/preference#";
//    private Map<String, List<String>> entityMap;
//
//    @Mock
//    private PreferenceService preferenceService;
//
//    @Mock
//    private SesameTransformer transformer;
//
//    @Mock
//    private RepositoryManager repositoryManager;
//
//    @Override
//    protected Application configureApp() throws Exception {
//        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
//        repo.initialize();
//
//        vf = getValueFactory();
//
//        activityFactory = getRequiredOrmFactory(Activity.class);
//        entityFactory = getRequiredOrmFactory(Entity.class);
//
//        provData = IOUtils.toString(getClass().getResourceAsStream("/prov-data.ttl"), StandardCharsets.UTF_8);
//        activityIRIs = IntStream.range(0, 10)
//                .mapToObj(i -> ACTIVITY_NAMESPACE + "Activity" + i)
//                .collect(Collectors.toList());
//        Collections.reverse(activityIRIs);
//
//        entityIRIs = IntStream.range(0, 5)
//                .mapToObj(i -> ENTITY_NAMESPACE + "Entity" + i)
//                .collect(Collectors.toList());
//
//        entityMap = new HashMap<>();
//        entityMap.put(activityIRIs.get(0), Collections.singletonList(entityIRIs.get(0)));
//        entityMap.put(activityIRIs.get(1), Collections.singletonList(entityIRIs.get(0)));
//        entityMap.put(activityIRIs.get(2), Collections.singletonList(entityIRIs.get(1)));
//        entityMap.put(activityIRIs.get(3), Stream.of(entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));
//        entityMap.put(activityIRIs.get(4), Stream.of(entityIRIs.get(1), entityIRIs.get(2)).collect(Collectors.toList()));
//        entityMap.put(activityIRIs.get(5), Collections.singletonList(entityIRIs.get(0)));
//        entityMap.put(activityIRIs.get(6), Collections.singletonList(entityIRIs.get(3)));
//        entityMap.put(activityIRIs.get(7), Collections.singletonList(entityIRIs.get(4)));
//        entityMap.put(activityIRIs.get(8), Collections.singletonList(entityIRIs.get(4)));
//        entityMap.put(activityIRIs.get(9), Stream.of(entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));
//
//        MockitoAnnotations.initMocks(this);
//
//        when(transformer.mobiModel(any(Model.class)))
//                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, Model.class)));
//        when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class)))
//                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
//        when(transformer.sesameStatement(any(Statement.class)))
//                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
//        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));
//
//        rest = new ProvRest();
//        rest.setMf(getModelFactory());
//        rest.setVf(vf);
//        rest.setProvService(provService);
//        rest.setTransformer(transformer);
//        rest.setRepositoryManager(repositoryManager);
//
//        return new ResourceConfig()
//                .register(rest)
//                .register(UsernameTestFilter.class)
//                .register(MultiPartFeature.class);
//    }
//
//    @Override
//    protected void configureClient(ClientConfig config) {
//        config.register(MultiPartFeature.class);
//    }
//
//    @BeforeMethod
//    public void setUpMocks() throws Exception {
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.add(Values.mobiModel(Rio.parse(new ByteArrayInputStream(provData.getBytes()), "", RDFFormat.TURTLE)));
//        }
//        reset(provService);
//
//        when(provService.getConnection()).thenReturn(repo.getConnection());
//        when(provService.getActivity(any(Resource.class))).thenAnswer(i -> {
//            Activity activity = activityFactory.createNew(i.getArgumentAt(0, Resource.class));
//            entityMap.get(activity.getResource().stringValue()).forEach(entityIRI -> entityFactory.createNew(vf.createIRI(entityIRI), activity.getModel()));
//            return Optional.of(activity);
//        });
//    }
//
//    @Test
//    public void getPreferencesWithNoneTest() throws Exception {
//        // Setup:
//        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.clear();
//        }
//
//        Response response = target().path("provenance-data").request().get();
//        assertEquals(response.getStatus(), 200);
//        MultivaluedMap<String, Object> headers = response.getHeaders();
//        assertEquals(headers.get("X-Total-Count").get(0), "0");
//        verify(provService, times(0)).getActivity(any(Resource.class));
//        try {
//            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
//            assertActivities(result, new ArrayList<>());
//            assertEntities(result, new ArrayList<>());
//        } catch (Exception e) {
//            fail("Expected no exception, but got: " + e.getMessage());
//        }
//    }
//
//    @Test
//    public void getActivitiesOnePageTest() throws Exception {
//        Response response = target().path("provenance-data").request().get();
//        assertEquals(response.getStatus(), 200);
//        MultivaluedMap<String, Object> headers = response.getHeaders();
//        assertEquals(headers.get("X-Total-Count").get(0), "10");
//        verify(provService, times(10)).getActivity(any(Resource.class));
//        try {
//            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
//            assertActivities(result, activityIRIs);
//            assertEntities(result, entityIRIs);
//        } catch (Exception e) {
//            fail("Expected no exception, but got: " + e.getMessage());
//        }
//    }
//
//    @Test
//    public void getActivitiesWithLinksTest() throws Exception {
//        Response response = target().path("provenance-data").queryParam("limit", 2).queryParam("offset", 2).request().get();
//        assertEquals(response.getStatus(), 200);
//        MultivaluedMap<String, Object> headers = response.getHeaders();
//        assertEquals(headers.get("X-Total-Count").get(0), "10");
//        Set<Link> links = response.getLinks();
//        assertEquals(links.size(), 2);
//        assertTrue(response.hasLink("prev"));
//        assertTrue(response.hasLink("next"));
//        verify(provService, times(2)).getActivity(any(Resource.class));
//        try {
//            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
//            assertActivities(result, activityIRIs.subList(2, 4));
//            assertEntities(result, Stream.of(entityIRIs.get(1), entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));
//        } catch (Exception e) {
//            fail("Expected no exception, but got: " + e.getMessage());
//        }
//    }
//
//    @Test
//    public void getActivitiesWithNegativeLimitTest() {
//        Response response = target().path("provenance-data").queryParam("limit", -1).request().get();
//        assertEquals(response.getStatus(), 400);
//    }
//
//    @Test
//    public void getActivitiesWithNegativeOffsetTest() {
//        Response response = target().path("provenance-data").queryParam("offset", -1).request().get();
//        assertEquals(response.getStatus(), 400);
//    }
//
//    @Test
//    public void getActivitiesWithErrorTest() {
//        // Setup:
//        doThrow(new MobiException()).when(provService).getConnection();
//
//        Response response = target().path("provenance-data").request().get();
//        assertEquals(response.getStatus(), 500);
//    }
//
//    private void assertResourceOrder(JSONArray array, List<String> expectedOrder) {
//        List<String> resources = getResources(array);
//        assertEquals(resources, expectedOrder);
//    }
//
//    private List<String> getResources(JSONArray array) {
//        List<String> resources = new ArrayList<>();
//        for (int i = 0; i < array.size(); i++) {
//            JSONObject obj = array.optJSONObject(i);
//            assertNotNull(obj);
//            String iri = obj.optString("@id");
//            assertNotNull(iri);
//            resources.add(iri);
//        }
//        return resources;
//    }
//
//    private void assertActivities(JSONObject result, List<String> expected) {
//        assertTrue(result.containsKey("activities"));
//        JSONArray activities = result.optJSONArray("activities");
//        assertNotNull(activities);
//        assertEquals(activities.size(), expected.size());
//        assertResourceOrder(activities, expected);
//    }
//
//    private void assertEntities(JSONObject result, List<String> expected) {
//        assertTrue(result.containsKey("entities"));
//        JSONArray entities = result.optJSONArray("entities");
//        assertNotNull(entities);
//        assertEquals(entities.size(), expected.size());
//        List<String> resources = getResources(entities);
//        assertTrue(resources.containsAll(expected));
//    }
//}
//
//}
