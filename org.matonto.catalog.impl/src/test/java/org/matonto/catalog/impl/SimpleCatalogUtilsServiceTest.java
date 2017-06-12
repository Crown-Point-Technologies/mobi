package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Revision;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDFS;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCatalogUtilsServiceTest {
    private SimpleCatalogUtilsService service;
    private Repository repo;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private CatalogFactory catalogFactory = new CatalogFactory();
    private RecordFactory recordFactory = new RecordFactory();
    private UnversionedRecordFactory unversionedRecordFactory = new UnversionedRecordFactory();
    private VersionedRecordFactory versionedRecordFactory = new VersionedRecordFactory();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private DistributionFactory distributionFactory = new DistributionFactory();
    private VersionFactory versionFactory = new VersionFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();

    private final IRI MISSING_IRI = vf.createIRI("http://matonto.org/test#missing");
    private final IRI EMPTY_IRI = vf.createIRI("http://matonto.org/test#empty");
    private final IRI RANDOM_IRI = vf.createIRI("http://matonto.org/test#random");
    private final IRI DIFFERENT_IRI = vf.createIRI("http://matonto.org/test#different");
    private final IRI USER_IRI = vf.createIRI("http://matonto.org/test/users#taken");
    private final IRI CATALOG_IRI = vf.createIRI("http://matonto.org/test/catalogs#catalog-distributed");
    private final IRI RECORD_IRI = vf.createIRI("http://matonto.org/test/records#record");
    private final IRI RECORD_NO_CATALOG_IRI = vf.createIRI("http://matonto.org/test/records#record-no-catalog");
    private final IRI UNVERSIONED_RECORD_IRI = vf.createIRI("http://matonto.org/test/records#unversioned-record");
    private final IRI UNVERSIONED_RECORD_NO_CATALOG_IRI = vf.createIRI("http://matonto.org/test/records#unversioned-record-no-catalog");
    private final IRI UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI = vf.createIRI("http://matonto.org/test/records#unversioned-record-missing-distribution");
    private final IRI VERSIONED_RECORD_IRI = vf.createIRI("http://matonto.org/test/records#versioned-record");
    private final IRI VERSIONED_RECORD_NO_CATALOG_IRI = vf.createIRI("http://matonto.org/test/records#versioned-record-no-catalog");
    private final IRI VERSIONED_RECORD_MISSING_VERSION_IRI = vf.createIRI("http://matonto.org/test/records#versioned-record-missing-version");
    private final IRI VERSIONED_RDF_RECORD_IRI = vf.createIRI("http://matonto.org/test/records#versioned-rdf-record");
    private final IRI VERSIONED_RDF_RECORD_NO_CATALOG_IRI = vf.createIRI("http://matonto.org/test/records#versioned-rdf-record-no-catalog");
    private final IRI VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI = vf.createIRI("http://matonto.org/test/records#versioned-rdf-record-missing-branch");
    private final IRI DISTRIBUTION_IRI = vf.createIRI("http://matonto.org/test/distributions#distribution");
    private final IRI LONE_DISTRIBUTION_IRI = vf.createIRI("http://matonto.org/test/distributions#lone-distribution");
    private final IRI VERSION_IRI = vf.createIRI("http://matonto.org/test/versions#version");
    private final IRI LONE_VERSION_IRI = vf.createIRI("http://matonto.org/test/versions#lone-version");
    private final IRI VERSION_MISSING_DISTRIBUTION_IRI = vf.createIRI("http://matonto.org/test/versions#version-missing-distribution");
    private final IRI BRANCH_IRI = vf.createIRI("http://matonto.org/test/branches#branch");
    private final IRI LONE_BRANCH_IRI = vf.createIRI("http://matonto.org/test/branches#lone-branch");
    private final IRI COMMIT_IRI = vf.createIRI("http://matonto.org/test/commits#commit");
    private final IRI COMMIT_NO_ADDITIONS_IRI = vf.createIRI("http://matonto.org/test/commits#commit-no-additions");
    private final IRI COMMIT_NO_DELETIONS_IRI = vf.createIRI("http://matonto.org/test/commits#commit-no-deletions");
    private final IRI IN_PROGRESS_COMMIT_IRI = vf.createIRI("http://matonto.org/test/commits#in-progress-commit");
    private final IRI IN_PROGRESS_COMMIT_NO_RECORD_IRI = vf.createIRI("http://matonto.org/test/commits#in-progress-commit-no-record");

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        catalogFactory.setModelFactory(mf);
        catalogFactory.setValueFactory(vf);
        catalogFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(catalogFactory);

        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(recordFactory);

        unversionedRecordFactory.setModelFactory(mf);
        unversionedRecordFactory.setValueFactory(vf);
        unversionedRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(unversionedRecordFactory);

        versionedRecordFactory.setModelFactory(mf);
        versionedRecordFactory.setValueFactory(vf);
        versionedRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRecordFactory);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRDFRecordFactory);

        distributionFactory.setModelFactory(mf);
        distributionFactory.setValueFactory(vf);
        distributionFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(distributionFactory);

        versionFactory.setModelFactory(mf);
        versionFactory.setValueFactory(vf);
        versionFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionFactory);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(branchFactory);

        commitFactory.setModelFactory(mf);
        commitFactory.setValueFactory(vf);
        commitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(commitFactory);

        inProgressCommitFactory.setModelFactory(mf);
        inProgressCommitFactory.setValueFactory(vf);
        inProgressCommitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(inProgressCommitFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        service = new SimpleCatalogUtilsService();
        service.setMf(mf);
        service.setVf(vf);
        service.setCatalogFactory(catalogFactory);
        service.setRecordFactory(recordFactory);
        service.setUnversionedRecordFactory(unversionedRecordFactory);
        service.setVersionedRecordFactory(versionedRecordFactory);
        service.setVersionedRDFRecordFactory(versionedRDFRecordFactory);
        service.setDistributionFactory(distributionFactory);
        service.setVersionFactory(versionFactory);
        service.setBranchFactory(branchFactory);
        service.setCommitFactory(commitFactory);
        service.setInProgressCommitFactory(inProgressCommitFactory);
    }

    /* resourceExists(Resource, String, RepositoryConnection) */

    @Test
    public void resourceExistsWithTypeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.resourceExists(MISSING_IRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(EMPTY_IRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(RANDOM_IRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(DIFFERENT_IRI, Record.TYPE, conn));
            assertTrue(service.resourceExists(RECORD_IRI, Record.TYPE, conn));
        }
    }

    /* resourceExists(Resource, RepositoryConnection) */

    @Test
    public void resourceExistsTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.resourceExists(MISSING_IRI, conn));
            assertFalse(service.resourceExists(EMPTY_IRI, conn));
            assertTrue(service.resourceExists(RANDOM_IRI, conn));
            assertTrue(service.resourceExists(RECORD_IRI, conn));
        }
    }

    /* testObjectId */

    @Test
    public void testObjectIdOfMissing() {
        testBadRecordId(MISSING_IRI);
    }

    @Test
    public void testObjectIdOfEmpty() {
        testBadRecordId(EMPTY_IRI);
    }

    @Test
    public void testObjectIdOfRandom() {
        testBadRecordId(RANDOM_IRI);
    }

    @Test
    public void testObjectIdOfDifferent() {
        testBadRecordId(DIFFERENT_IRI);
    }

    /* addObject */

    @Test
    public void addObjectTest() throws Exception {
        // Setup
        Record record = recordFactory.createNew(EMPTY_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, EMPTY_IRI).hasNext());

            service.addObject(record, conn);
            assertEquals(record.getModel().size(), RepositoryResults.asModel(conn.getStatements(null, null, null, EMPTY_IRI), mf).size());
        }
    }

    /* updateObject */

    @Test
    public void updateObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            Record newRecord = recordFactory.createNew(RECORD_IRI);

            service.updateObject(newRecord, conn);
            RepositoryResults.asModel(conn.getStatements(null, null, null, RECORD_IRI), mf).forEach(statement ->
                    assertTrue(newRecord.getModel().contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    /* optObject */

    @Test
    public void optObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.optObject(MISSING_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(EMPTY_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(RANDOM_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(DIFFERENT_IRI, recordFactory, conn).isPresent());
            assertTrue(service.optObject(RECORD_IRI, recordFactory, conn).isPresent());
        }
    }

    /* getObject */

    @Test
    public void getObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getObject(RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getMissingObjectTest() {
        getBadRecord(MISSING_IRI);
    }

    @Test
    public void getEmptyObjectTest() {
        getBadRecord(EMPTY_IRI);
    }

    @Test
    public void getRandomObjectTest() {
        getBadRecord(RANDOM_IRI);
    }

    @Test
    public void getDifferentObjectTest() {
        getBadRecord(DIFFERENT_IRI);
    }

    /* remove */

    @Test
    public void removeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            service.remove(RECORD_IRI, conn);
            assertFalse(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
        }
    }

    /* removeObject */

    @Test
    public void removeObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            service.removeObject(recordFactory.createNew(RECORD_IRI), conn);
            assertFalse(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
        }
    }

    /* testRecordPath */

    @Test
    public void testRecordPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(MISSING_IRI, RECORD_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(CATALOG_IRI, MISSING_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    /* getRecord */

    @Test
    public void getRecordTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getRecord(CATALOG_IRI, RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getRecordWithMissingCatalog(){
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(MISSING_IRI, RECORD_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(CATALOG_IRI, MISSING_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory, conn);
        }
    }

    /* testUnversionedDistributionPath */

    @Test
    public void testUnversionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testUnversionedDistributionPath(MISSING_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testUnversionedDistributionPath(CATALOG_IRI, MISSING_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testUnversionedDistributionPath(CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to UnversionedRecord %s", LONE_DISTRIBUTION_IRI, UNVERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testUnversionedDistributionPath(CATALOG_IRI, UNVERSIONED_RECORD_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    /* getUnversionedDistribution */

    @Test
    public void getUnversionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(MISSING_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, MISSING_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to UnversionedRecord %s", LONE_DISTRIBUTION_IRI, UNVERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testUnversionedDistributionPath(CATALOG_IRI, UNVERSIONED_RECORD_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingUnversionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI, RANDOM_IRI, conn);
        }
    }

    /* testVersionPath */

    @Test
    public void testVersionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionPath(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionPath(CATALOG_IRI, MISSING_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionPath(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionPath(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, conn);
        }
    }

    /* getVersion */

    @Test
    public void getVersionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Version version = service.getVersion(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, versionFactory, conn);
            assertFalse(version.getModel().isEmpty());
            assertEquals(VERSION_IRI, version.getResource());
        }
    }

    @Test
    public void getVersionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, MISSING_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getMissingVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, versionFactory, conn);
        }
    }

    /* testVersionedDistributionPath */

    @Test
    public void testVersionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(CATALOG_IRI, MISSING_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testVersionedDistributionPath(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    /* getVersionedDistribution */

    @Test
    public void getVersionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getVersionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, MISSING_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingVersionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, VERSION_MISSING_DISTRIBUTION_IRI, RANDOM_IRI, conn);
        }
    }

    /* testBranchPath */

    @Test
    public void testBranchPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(MISSING_IRI, RECORD_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(CATALOG_IRI, MISSING_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, LONE_BRANCH_IRI, conn);
        }
    }

    /* getBranch(Resource, Resource, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Branch branch = service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(MISSING_IRI, RECORD_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, MISSING_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, RANDOM_IRI, branchFactory, conn);
        }
    }

    /* getBranch(VersionedRDFRecord, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchWithRecordTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(BRANCH_IRI)));
            Branch branch = service.getBranch(record, BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithRecordAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            service.getBranch(record, LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchWithRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(RANDOM_IRI)));
            service.getBranch(record, RANDOM_IRI, branchFactory, conn);
        }
    }

    /* getHeadCommitIRI */

    @Test
    public void getHeadCommitIRITest() {
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        branch.setHead(commitFactory.createNew(COMMIT_IRI));
        Resource iri = service.getHeadCommitIRI(branch);
        assertEquals(COMMIT_IRI, iri);
    }

    @Test
    public void getHeadCommitIRINotSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Branch " + LONE_BRANCH_IRI + " does not have a head Commit set");
        Branch branch = branchFactory.createNew(LONE_BRANCH_IRI);

        service.getHeadCommitIRI(branch);
    }

    /* testInProgressCommitPath */

    @Test
    public void testInProgressCommitPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(MISSING_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(CATALOG_IRI, MISSING_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testMissingInProgressCommitPath() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, MISSING_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithoutRecordSet() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("InProgressCommit %s does not belong to VersionedRDFRecord %s", IN_PROGRESS_COMMIT_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testInProgressCommitPath(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithUserTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(VERSIONED_RDF_RECORD_IRI, USER_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getMissingInProgressCommitTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit not found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(VERSIONED_RECORD_MISSING_VERSION_IRI, USER_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithPathTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(MISSING_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, MISSING_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getMissingInProgressCommitWithPathTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, MISSING_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathWithoutRecordSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + IN_PROGRESS_COMMIT_IRI + " does not belong to VersionedRDFRecord " + VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommitIRI */

    @Test
    public void getInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = service.getInProgressCommitIRI(VERSIONED_RDF_RECORD_IRI, USER_IRI, conn);
            assertTrue(iri.isPresent());
            assertEquals(IN_PROGRESS_COMMIT_IRI, iri.get());
        }
    }

    @Test
    public void getMissingInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = service.getInProgressCommitIRI(VERSIONED_RECORD_MISSING_VERSION_IRI, USER_IRI, conn);
            assertFalse(iri.isPresent());
        }
    }

    /* removeInProgressCommit */

    @Test
    public void removeInProgressCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = getThing(IN_PROGRESS_COMMIT_IRI, inProgressCommitFactory, conn);
            Resource additionsResource = getAdditionsResource(IN_PROGRESS_COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(IN_PROGRESS_COMMIT_IRI);
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource ) > 0);

            service.removeInProgressCommit(commit, conn);
            assertFalse(conn.getStatements(null, null, null, IN_PROGRESS_COMMIT_IRI).hasNext());
            assertTrue(conn.size(additionsResource) == 0);
            assertTrue(conn.size(deletionsResource) == 0);
        }
    }

    @Test
    public void removeInProgressCommitWithReferencedChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = inProgressCommitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#in-progress-commit-referenced"));
            Resource additionsResource = getAdditionsResource(COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(COMMIT_IRI);
            commit.getModel().add(commit.getResource(), vf.createIRI(Revision.additions_IRI), additionsResource, commit.getResource());
            commit.getModel().add(commit.getResource(), vf.createIRI(Revision.deletions_IRI), deletionsResource, commit.getResource());
            assertTrue(conn.getStatements(null, null, null, commit.getResource()).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource ) > 0);

            service.removeInProgressCommit(commit, conn);
            assertFalse(conn.getStatements(null, null, null, commit.getResource()).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);
        }
    }

    /* updateCommit(Commit, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            IRI rdfsLabel = vf.createIRI(RDFS.LABEL.stringValue());
            IRI dcTitle = vf.createIRI(DCTERMS.TITLE.stringValue());
            IRI dcDescription = vf.createIRI(DCTERMS.DESCRIPTION.stringValue());
            Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), dcTitle, vf.createLiteral("Title"));
            Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), dcDescription, vf.createLiteral("Description"));
            Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), rdfsLabel, vf.createLiteral("Label"));
            Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), dcTitle, vf.createLiteral("Delete"));
            Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), dcTitle, vf.createLiteral("Add"));
            Model additions = mf.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
            Model deletions = mf.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = mf.createModel(Stream.of(statement1).collect(Collectors.toSet()));
            Model expectedDeletions = mf.createModel(Stream.of(statement3).collect(Collectors.toSet()));

            service.updateCommit(commit, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitWithoutAdditionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_ADDITIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

            service.updateCommit(commit, mf.createModel(), mf.createModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitWithoutDeletionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_DELETIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

            service.updateCommit(commit, mf.createModel(), mf.createModel(), conn);
        }
    }

    /* updateCommit(Resource, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithResourceTest() {
        // Setup:
        Resource additionId = getAdditionsResource(COMMIT_IRI);
        Resource deletionId = getDeletionsResource(COMMIT_IRI);
        IRI rdfsLabel = vf.createIRI(RDFS.LABEL.stringValue());
        IRI dcTitle = vf.createIRI(DCTERMS.TITLE.stringValue());
        IRI dcDescription = vf.createIRI(DCTERMS.DESCRIPTION.stringValue());
        Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), dcTitle, vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), dcDescription, vf.createLiteral("Description"));
        Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), rdfsLabel, vf.createLiteral("Label"));
        Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), dcTitle, vf.createLiteral("Delete"));
        Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), dcTitle, vf.createLiteral("Add"));
        Model additions = mf.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = mf.createModel(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = mf.createModel(Stream.of(statement3).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_IRI, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithResourceWithoutAdditionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_NO_ADDITIONS_IRI, mf.createModel(), mf.createModel(), conn);
        }
    }

    @Test
    public void updateCommitWithResourceWithoutDeletionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_NO_DELETIONS_IRI, mf.createModel(), mf.createModel(), conn);
        }
    }

    /* addCommit */

    @Test
    public void addCommitTest() {
        // Setup:
        IRI newIRI = vf.createIRI("http://matonto.org/test#new");
        IRI headCommitIRI = vf.createIRI("http://matonto.org/test/commits#conflict2");
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        Commit commit = commitFactory.createNew(newIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, newIRI).hasNext());
            assertTrue(conn.getStatements(BRANCH_IRI, headIRI, headCommitIRI, BRANCH_IRI).hasNext());

            service.addCommit(branch, commit, conn);
            assertTrue(branch.getHead_resource().isPresent());
            assertEquals(newIRI, branch.getHead_resource().get());
            assertTrue(conn.getStatements(null, null, null, newIRI).hasNext());
            assertTrue(conn.getStatements(BRANCH_IRI, headIRI, newIRI, BRANCH_IRI).hasNext());
        }
    }

    @Test
    public void addCommitWithTakenResourceTest() {
        // Setup:
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        Commit commit = commitFactory.createNew(COMMIT_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Commit " + COMMIT_IRI + " already exists");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, commit, conn);
        }
    }

    /* getAdditionsResource(Resource, conn) */

    @Test
    public void getAdditionsResourceWithResourceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Resource result = service.getAdditionsResource(COMMIT_IRI, conn);
            assertEquals(getAdditionsResource(COMMIT_IRI), result);
        }
    }

    @Test
    public void getAdditionsResourceWithResourceAndAdditionsNotSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getAdditionsResource(COMMIT_NO_ADDITIONS_IRI, conn);
        }
    }

    /* getDeletionsResource(Resource, conn) */

    @Test
    public void getDeletionsResourceWithResourceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Resource result = service.getDeletionsResource(COMMIT_IRI, conn);
            assertEquals(getDeletionsResource(COMMIT_IRI), result);
        }
    }

    @Test
    public void getDeletionsResourceWithResourceAndDeletionsNotSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getDeletionsResource(COMMIT_NO_DELETIONS_IRI, conn);
        }
    }

    /* getAdditionsResource(Resource, conn) */

    @Test
    public void getAdditionsResourceWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);

            Resource result = service.getAdditionsResource(commit);
            assertEquals(getAdditionsResource(COMMIT_IRI), result);
        }
    }

    @Test
    public void getAdditionsResourceWithCommitAndAdditionsNotSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_ADDITIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

            service.getAdditionsResource(commit);
        }
    }

    /* getDeletionsResource(Resource, conn) */

    @Test
    public void getDeletionsResourceWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);

            Resource result = service.getDeletionsResource(commit);
            assertEquals(getDeletionsResource(COMMIT_IRI), result);
        }
    }

    @Test
    public void getDeletionsResourceWithCommitAndDeletionsNotSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_DELETIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

            service.getDeletionsResource(commit);
        }
    }

    /* addChanges */

    @Test
    public void addChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            IRI dcTitle = vf.createIRI(DCTERMS.TITLE.stringValue());
            Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), dcTitle, vf.createLiteral("Title"));
            Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), dcTitle, vf.createLiteral("Add"));
            Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), dcTitle, vf.createLiteral("Delete"));
            Model additions = mf.createModel(Stream.of(statement1, existingDeleteStatement).collect(Collectors.toSet()));
            Model expectedAdditions = mf.createModel(Stream.of(existingAddStatement, statement1).collect(Collectors.toSet()));

            service.addChanges(additionId, deletionId, additions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            assertEquals(0, conn.size(deletionId));
        }
    }

    /* throwAlreadyExists */

    @Test
    public void throwAlreadyExistsTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " already exists");

        throw service.throwAlreadyExists(RECORD_IRI, recordFactory);
    }

    /* throwDoesNotBelong */

    @Test
    public void throwDoesNotBelongTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " does not belong to Catalog " + CATALOG_IRI);

        throw service.throwDoesNotBelong(RECORD_IRI, recordFactory, CATALOG_IRI, catalogFactory);
    }

    /* throwThingNotFound */

    @Test
    public void throwThingNotFoundTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " could not be found");

        throw service.throwThingNotFound(RECORD_IRI, recordFactory);
    }


    private void testBadRecordId(Resource resource) {
        // Setup:
        IRI classIRI = vf.createIRI(Record.TYPE);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), resource));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testObjectId(resource, classIRI, conn);
        }
    }

    private void getBadRecord(Resource resource) {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", recordFactory.getTypeIRI().getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getObject(resource, recordFactory, conn);
        }
    }

    private IRI getAdditionsResource(IRI commitId) {
        return vf.createIRI("http://matonto.org/test/additions#" + commitId.getLocalName());
    }

    private IRI getDeletionsResource(IRI commitId) {
        return vf.createIRI("http://matonto.org/test/deletions#" + commitId.getLocalName());
    }

    private <T extends Thing> T getThing(Resource thingId, OrmFactory<T> factory, RepositoryConnection conn) {
        Model thingModel = RepositoryResults.asModel(conn.getStatements(null, null, null, thingId), mf);
        return factory.getExisting(thingId, thingModel).get();
    }
}
