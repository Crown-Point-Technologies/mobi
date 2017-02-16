/*-
 * #%L
 * org.matonto.etl.delimited
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
package org.matonto.catalog.impl

import org.matonto.catalog.api.builder.DistributionConfig
import org.matonto.catalog.api.builder.RecordConfig
import org.matonto.catalog.api.ontologies.mcat.*
import org.matonto.jaas.api.ontologies.usermanagement.User
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
import org.matonto.repository.api.Repository
import spock.lang.Specification

class SimpleCatalogManagerSpec extends Specification {

    def repository = Mock(Repository)
    def model = Mock(Model)
    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
    def catalog = Mock(Catalog)
    def userFactory = new UserFactory()
    def user
    def vcr = new DefaultValueConverterRegistry()
    def service = new SimpleCatalogManager()
    def catalogFactory = new CatalogFactory()
    def recordFactory = new RecordFactory()
    def unversionedRecordFactory = new UnversionedRecordFactory()
    def versionedRecordFactory = new VersionedRecordFactory()
    def versionedRDFRecordFactory = new VersionedRDFRecordFactory()
    def ontologyRecordFactory = new OntologyRecordFactory()
    def mappingRecordFactory = new MappingRecordFactory()
    def datasetRecordFactory = new DatasetRecordFactory()
    def distributionFactory = new DistributionFactory()
    def versionFactory = new VersionFactory()
    def branchFactory = new BranchFactory()
    def tagFactory = new TagFactory()
    def inProgressCommitFactory = new InProgressCommitFactory()
    def commitFactory = new CommitFactory()
    def revisionFactory = new RevisionFactory()
    def userBranchFactory = new UserBranchFactory()
    def thingFactory = new ThingFactory()
    def title = "title"
    def description = "description"
    def identifier = "identifier"
    def keywords = new HashSet<String>()
    def publishers = new HashSet<User>()
    def dcTerms = "http://purl.org/dc/terms/"
    def dcTitle = dcTerms + "title"
    def dcDescription = dcTerms + "description"
    def dcIdentifier = dcTerms + "identifier"
    def dcIssued = dcTerms + "issued"
    def dcModified = dcTerms + "modified"
    def dcPublisher = dcTerms + "publisher"
    def prov = "http://www.w3.org/ns/prov#"
    def provGenerated = prov + "generated"
    def accessURL
    def downloadURL
    def format = "format"
    def parents = new HashSet<Commit>()
    def dummyCommit
    def dummyBranchIRI

    def setup() {
        catalogFactory.setValueFactory(vf)
        catalogFactory.setModelFactory(mf)
        catalogFactory.setValueConverterRegistry(vcr)
        recordFactory.setValueFactory(vf)
        recordFactory.setModelFactory(mf)
        recordFactory.setValueConverterRegistry(vcr)
        unversionedRecordFactory.setValueFactory(vf)
        unversionedRecordFactory.setModelFactory(mf)
        unversionedRecordFactory.setValueConverterRegistry(vcr)
        versionedRecordFactory.setValueFactory(vf)
        versionedRecordFactory.setModelFactory(mf)
        versionedRecordFactory.setValueConverterRegistry(vcr)
        versionedRDFRecordFactory.setValueFactory(vf)
        versionedRDFRecordFactory.setModelFactory(mf)
        versionedRDFRecordFactory.setValueConverterRegistry(vcr)
        ontologyRecordFactory.setValueFactory(vf)
        ontologyRecordFactory.setModelFactory(mf)
        ontologyRecordFactory.setValueConverterRegistry(vcr)
        mappingRecordFactory.setValueFactory(vf)
        mappingRecordFactory.setModelFactory(mf)
        mappingRecordFactory.setValueConverterRegistry(vcr)
        datasetRecordFactory.setValueFactory(vf)
        datasetRecordFactory.setModelFactory(mf)
        datasetRecordFactory.setValueConverterRegistry(vcr)
        distributionFactory.setValueFactory(vf)
        distributionFactory.setModelFactory(mf)
        distributionFactory.setValueConverterRegistry(vcr)
        branchFactory.setValueFactory(vf)
        branchFactory.setModelFactory(mf)
        branchFactory.setValueConverterRegistry(vcr)
        inProgressCommitFactory.setValueFactory(vf)
        inProgressCommitFactory.setModelFactory(mf)
        inProgressCommitFactory.setValueConverterRegistry(vcr)
        commitFactory.setValueFactory(vf)
        commitFactory.setModelFactory(mf)
        commitFactory.setValueConverterRegistry(vcr)
        tagFactory.setValueFactory(vf)
        tagFactory.setModelFactory(mf)
        tagFactory.setValueConverterRegistry(vcr)
        versionFactory.setValueFactory(vf)
        versionFactory.setModelFactory(mf)
        versionFactory.setValueConverterRegistry(vcr)
        revisionFactory.setValueFactory(vf)
        revisionFactory.setModelFactory(mf)
        revisionFactory.setValueConverterRegistry(vcr)
        userBranchFactory.setValueFactory(vf)
        userBranchFactory.setModelFactory(mf)
        userBranchFactory.setValueConverterRegistry(vcr)
        userFactory.setValueFactory(vf)
        userFactory.setModelFactory(mf)
        userFactory.setValueConverterRegistry(vcr)
        thingFactory.setModelFactory(mf)
        thingFactory.setValueFactory(vf)
        thingFactory.setValueConverterRegistry(vcr)

        vcr.registerValueConverter(catalogFactory)
        vcr.registerValueConverter(recordFactory)
        vcr.registerValueConverter(distributionFactory)
        vcr.registerValueConverter(versionFactory)
        vcr.registerValueConverter(branchFactory)
        vcr.registerValueConverter(thingFactory)
        vcr.registerValueConverter(unversionedRecordFactory)
        vcr.registerValueConverter(versionedRecordFactory)
        vcr.registerValueConverter(versionedRDFRecordFactory)
        vcr.registerValueConverter(ontologyRecordFactory)
        vcr.registerValueConverter(mappingRecordFactory)
        vcr.registerValueConverter(datasetRecordFactory)
        vcr.registerValueConverter(tagFactory)
        vcr.registerValueConverter(inProgressCommitFactory)
        vcr.registerValueConverter(commitFactory)
        vcr.registerValueConverter(revisionFactory)
        vcr.registerValueConverter(userBranchFactory)
        vcr.registerValueConverter(new ResourceValueConverter())
        vcr.registerValueConverter(new IRIValueConverter())
        vcr.registerValueConverter(new DoubleValueConverter())
        vcr.registerValueConverter(new IntegerValueConverter())
        vcr.registerValueConverter(new FloatValueConverter())
        vcr.registerValueConverter(new ShortValueConverter())
        vcr.registerValueConverter(new StringValueConverter())
        vcr.registerValueConverter(new ValueValueConverter())
        vcr.registerValueConverter(new LiteralValueConverter())

        service.setRepository(repository)
        service.setValueFactory(vf)
        service.setModelFactory(mf)
        service.setCatalogFactory(catalogFactory)
        service.setRecordFactory(recordFactory)
        service.setDistributionFactory(distributionFactory)
        service.setBranchFactory(branchFactory)
        service.setUserFactory(userFactory)
        service.setCommitFactory(commitFactory)
        service.setInProgressCommitFactory(inProgressCommitFactory)
        service.setRevisionFactory(revisionFactory)
        service.setVersionedRDFRecordFactory(versionedRDFRecordFactory)
        service.setVersionedRecordFactory(versionedRecordFactory)
        service.setUnversionedRecordFactory(unversionedRecordFactory)
        service.setVersionFactory(versionFactory)

        catalog.getModel() >> model

        keywords.add("keyword1")
        keywords.add("keyword2")

        user = userFactory.createNew(vf.createIRI("https://matonto.org/test/user"))
        publishers.add(user)

        dummyCommit = commitFactory.createNew(vf.createIRI("https://matonto.org/test/commit"))
        dummyCommit.setProperty(vf.createIRI("https://matonto.org/revision"), vf.createIRI(provGenerated))
        parents.add(dummyCommit)

        dummyBranchIRI = vf.createIRI("https://matonto.org/test/branch")

        accessURL = vf.createIRI("http://matonto.org/test/accessURL")
        downloadURL = vf.createIRI("http://matonto.org/test/downloadURL")
    }

    def "createRecord creates a Record when provided a RecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, recordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof Record
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates a Record with no identifier, description or keywords when provided a RecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers).build()
        def record = service.createRecord(recordConfig, recordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof Record
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        !record.getProperty(vf.createIRI(dcDescription)).isPresent()
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        record.getKeyword().size() == 0
        publishers.contains(user.getResource())
    }

    def "createRecord creates an UnversionedRecord when provided an UnversionedRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, unversionedRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof UnversionedRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates a VersionedRecord when provided a VersionedRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, versionedRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof VersionedRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates a VersionedRDFRecord when provided a VersionedRDFRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, versionedRDFRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof VersionedRDFRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates an OntologyRecord when provided an OntologyRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, ontologyRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof OntologyRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates a MappingRecord when provided a MappingRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, mappingRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof MappingRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createRecord creates a DatasetRecord when provided a DatasetRecordFactory"() {
        setup:
        def recordConfig = new RecordConfig.Builder(title, publishers)
                .identifier(identifier)
                .description(description)
                .keywords(keywords)
                .build()
        def record = service.createRecord(recordConfig, datasetRecordFactory)
        def publishers = record.getProperties(vf.createIRI(dcPublisher))

        expect:
        record instanceof DatasetRecord
        def keywords = record.getKeyword()
        record.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        record.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        record.getProperty(vf.createIRI(dcIdentifier)).get().stringValue() == identifier
        record.getProperty(vf.createIRI(dcIssued)).isPresent()
        record.getProperty(vf.createIRI(dcModified)).isPresent()
        keywords.contains(vf.createLiteral("keyword1"))
        keywords.contains(vf.createLiteral("keyword2"))
        publishers.contains(user.getResource())
    }

    def "createDistribution creates a Distribution"() {
        setup:
        def distributionConfig = new DistributionConfig.Builder(title)
                .description(description)
                .format(format)
                .accessURL(accessURL)
                .downloadURL(downloadURL)
                .build()
        def distribution = service.createDistribution(distributionConfig)

        expect:
        distribution instanceof Distribution
        distribution.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        distribution.getProperty(vf.createIRI(dcDescription)).get().stringValue() == description
        distribution.getProperty(vf.createIRI(dcTerms + "format")).get().stringValue() == format
        distribution.getAccessURL().get().stringValue() == accessURL.stringValue()
        distribution.getDownloadURL().get().stringValue() == downloadURL.stringValue()
        distribution.getProperty(vf.createIRI(dcIssued)).isPresent()
        distribution.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createDistribution creates a Distribution with no description, format, accessURL, or downloadURL"() {
        setup:
        def distributionConfig = new DistributionConfig.Builder(title)
                .build()
        def distribution = service.createDistribution(distributionConfig)

        expect:
        distribution instanceof Distribution
        distribution.getProperty(vf.createIRI(dcTitle)).get().stringValue() == title
        !distribution.getProperty(vf.createIRI(dcDescription)).isPresent()
        !distribution.getProperty(vf.createIRI(dcTerms + "format")).isPresent()
        !distribution.getAccessURL().isPresent()
        !distribution.getDownloadURL().isPresent()
        distribution.getProperty(vf.createIRI(dcIssued)).isPresent()
        distribution.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createVersion creates a Version when provided a VersionFactory"() {
        setup:
        def version = service.createVersion("title", "description", versionFactory)

        expect:
        version instanceof Version
        version.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        version.getProperty(vf.createIRI(dcDescription)).get().stringValue() == "description"
        version.getProperty(vf.createIRI(dcIssued)).isPresent()
        version.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createVersion creates a Version with no description when provided a VersionFactory"() {
        setup:
        def version = service.createVersion("title", null, versionFactory)

        expect:
        version instanceof Version
        version.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        !version.getProperty(vf.createIRI(dcDescription)).isPresent()
        version.getProperty(vf.createIRI(dcIssued)).isPresent()
        version.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createVersion creates a Tag when provided a TagFactory"() {
        setup:
        def version = service.createVersion("title", "description", tagFactory)

        expect:
        version instanceof Tag
        version.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        version.getProperty(vf.createIRI(dcDescription)).get().stringValue() == "description"
        version.getProperty(vf.createIRI(dcIssued)).isPresent()
        version.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createBranch creates a Branch"() {
        setup:
        def branch = service.createBranch("title", "description", branchFactory)

        expect:
        branch instanceof Branch
        branch.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        branch.getProperty(vf.createIRI(dcDescription)).get().stringValue() == "description"
        branch.getProperty(vf.createIRI(dcIssued)).isPresent()
        branch.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createBranch creates a UserBranch when provided a UserBranchFactory"() {
        setup:
        def branch = service.createBranch("title", "description", userBranchFactory)

        expect:
        branch instanceof UserBranch
        branch.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        branch.getProperty(vf.createIRI(dcDescription)).get().stringValue() == "description"
        branch.getProperty(vf.createIRI(dcIssued)).isPresent()
        branch.getProperty(vf.createIRI(dcModified)).isPresent()
    }

    def "createBranch creates a Branch with no description"() {
        setup:
        def branch = service.createBranch("title", null, branchFactory)

        expect:
        branch instanceof Branch
        branch.getProperty(vf.createIRI(dcTitle)).get().stringValue() == "title"
        !branch.getProperty(vf.createIRI(dcDescription)).isPresent()
        branch.getProperty(vf.createIRI(dcIssued)).isPresent()
        branch.getProperty(vf.createIRI(dcModified)).isPresent()
    }
}
