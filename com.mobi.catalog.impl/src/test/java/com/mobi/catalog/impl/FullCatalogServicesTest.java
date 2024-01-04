package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;
import java.util.UUID;

public class FullCatalogServicesTest extends OrmEnabledTestCase{
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);

    private Statement initialComment;
    private Statement commentA;
    private Statement commentB;

    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#user");
    private final IRI PROV_AT_TIME = VALUE_FACTORY.createIRI("http://www.w3.org/ns/prov#atTime");
    private static final String COMMITS = "http://mobi.com/test/commits#";

    private final SimpleThingManager thingManager = new SimpleThingManager();
    private final SimpleRecordManager recordManager = new SimpleRecordManager();
    private final SimpleBranchManager branchManager = new SimpleBranchManager();
    private final SimpleCommitManager commitManager = new SimpleCommitManager();
    private final SimpleCompiledResourceManager compiledResourceManager = new SimpleCompiledResourceManager();
    private final SimpleRevisionManager revisionManager = new SimpleRevisionManager();
    private final SimpleVersionManager versionManager = new SimpleVersionManager();


    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        closeable = MockitoAnnotations.openMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);

        injectOrmFactoryReferencesIntoService(commitManager);
        commitManager.recordManager = recordManager;
        commitManager.revisionManager = revisionManager;
        commitManager.branchManager = branchManager;
        commitManager.thingManager = thingManager;
        commitManager.versionManager = versionManager;

        InputStream testData = getClass().getResourceAsStream("/testCommitChainData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        recordManager.start();

        initialComment = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment"));
        commentA = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment A"));
        commentB = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment B"));
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase1() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      B       - Comment + Comment B
        //      C                                       - Comment + Comment B
        //      D       - Comment B + Comment A

        // Setup:
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitCIri = VALUE_FACTORY.createIRI(COMMITS + "commit-c");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch1");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitCIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitCIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), deletions, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase2() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      B       - Comment + Comment B
        //      D       - Comment B + Comment A
        //      E                                       - Comment + Comment B

        // Setup:
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitEIri = VALUE_FACTORY.createIRI(COMMITS + "commit-e");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitEIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitEIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), deletions, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase3() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      F                                       - Comment + Comment B
        //      B       - Comment + Comment B
        //      D       - Comment B + Comment A

        // Setup:
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitFIri = VALUE_FACTORY.createIRI(COMMITS + "commit-f");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitFIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitFIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), deletions, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase1() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      H       + Comment B
        //      I                                       + Comment B
        //      J       - Comment B + Comment A

        // Setup:
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitIIri = VALUE_FACTORY.createIRI(COMMITS + "commit-i");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch1");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitIIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitIIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase2() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      H       + Comment B
        //      J       - Comment B + Comment A
        //      K                                       + Comment B

        // Setup:
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitKIri = VALUE_FACTORY.createIRI(COMMITS + "commit-k");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitKIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitKIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase3() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      L                                       + Comment B
        //      H       + Comment B
        //      J       - Comment B + Comment A

        // Setup:
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitLIri = VALUE_FACTORY.createIRI(COMMITS + "commit-l");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = QueryResults.asModel(conn.getStatements(null, null, null, commitLIri), MODEL_FACTORY);
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitLIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = commitManager.createCommit(commitManager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            commitManager.addCommit(rightBranch, mergeCommit, conn);
            commitManager.updateCommit(mergeCommit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitsFromMerge, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void getCompiledResourceTiming() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Need dates to have an ordered commit list
            DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            long dayInMs = 86400000;
            long timeMillis = System.currentTimeMillis();
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(timeMillis);

            // Build out large commit chain
            Branch branch = branchFactory.createNew(VALUE_FACTORY.createIRI("urn:testBranch"));
            thingManager.addObject(branch, conn);
            Commit previousCommit = null;
            Model statementsToDelete = getModelFactory().createEmptyModel();
            int numberOfCommits = 1000;
            for (int i = 0; i < numberOfCommits; i++) {
                IRI commitIRI = VALUE_FACTORY.createIRI("urn:commit" + i);
                Commit commit = commitFactory.createNew(commitIRI);
                if (i != 0) {
                    commit.setBaseCommit(previousCommit);
                }

                IRI revisionIRI = VALUE_FACTORY.createIRI("urn:revision" + i);
                IRI additionsIRI = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "addition" + i);
                IRI deletionsIRI = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "deletion" + i);
                IRI nextDeletionsIRI = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "deletion" + (i + 1));

                Revision revision = revisionFactory.createNew(revisionIRI, commit.getModel());
                revision.setAdditions(additionsIRI);
                revision.setDeletions(deletionsIRI);

                commit.setProperty(revisionIRI, VALUE_FACTORY.createIRI(Activity.generated_IRI));
                commit.setProperty(VALUE_FACTORY.createLiteral(df.format(calendar.getTime())), PROV_AT_TIME);

                Model additions = MODEL_FACTORY.createEmptyModel();
                Model currentDeletions = MODEL_FACTORY.createEmptyModel();
                currentDeletions.addAll(statementsToDelete);
                statementsToDelete.clear();

                for (int j = 0; j < 10; j++) {
                    String uuid = UUID.randomUUID().toString();
                    if (j == 0 || j == 1) {
                        // Keep track of statements to delete in next commit
                        statementsToDelete.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                                VALUE_FACTORY.createLiteral(uuid), nextDeletionsIRI);
                    }
                    additions.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                            VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                            VALUE_FACTORY.createLiteral(uuid), additionsIRI);
                }
                conn.add(additions);
                conn.add(currentDeletions);

                commitManager.addCommit(branch, commit, conn);
                previousCommit = commit;
                timeMillis = timeMillis + dayInMs;
                calendar.setTimeInMillis(timeMillis);
            }

            List<Resource> commitChain = commitManager.getCommitChain(previousCommit.getResource(), true, conn);

            long start = System.nanoTime();
            Model branchCompiled = compiledResourceManager.getCompiledResource(commitChain, conn);
            long end = System.nanoTime();
            long opTime = (end - start) / 1000000;
            System.out.println("CatalogUtilsService getCompiledResource operation time (ms): " + opTime);

            assertEquals(numberOfCommits, commitChain.size());
            assertEquals(numberOfCommits * 8 + 2, branchCompiled.size());
        }
    }
}
