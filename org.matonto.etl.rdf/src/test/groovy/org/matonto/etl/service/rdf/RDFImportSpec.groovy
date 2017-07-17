/*-
 * #%L
 * org.matonto.etl.rdf
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
package org.matonto.etl.service.rdf

import org.matonto.dataset.api.DatasetConnection
import org.matonto.dataset.api.DatasetManager
import org.matonto.etl.api.config.ImportServiceConfig
import org.matonto.persistence.utils.api.SesameTransformer
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.repository.api.DelegatingRepository
import org.matonto.repository.api.RepositoryConnection
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

class RDFImportSpec extends Specification {
    def service = new RDFImportServiceImpl()
    def vf = SimpleValueFactory.getInstance()

    def repoId = "test"
    def datasetId = vf.createIRI("http://test.com/dataset-record")
    def file = new ClassPathResource("importer/testFile.trig").getFile()
    def model = Values.matontoModel(Rio.parse(new FileInputStream(file), "", RDFFormat.TRIG))

    def transformer = Mock(SesameTransformer)
    def datasetManager = Mock(DatasetManager)
    def repo = Mock(DelegatingRepository)
    def conn = Mock(RepositoryConnection)
    def datasetConn = Mock(DatasetConnection)

    def setup() {
        transformer.matontoModel(_) >> { args -> Values.matontoModel(args[0])}
        repo.getRepositoryID() >> repoId
        repo.getConnection() >> conn
        datasetManager.getConnection(datasetId) >> datasetConn
        datasetManager.getConnection(!datasetId) >> {throw new IllegalArgumentException()}

        service.setTransformer(transformer)
        service.setDatasetManager(datasetManager)
        service.addRepository(repo)
    }

    def "Imports trig file to repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports trig file to repository with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).format(RDFFormat.TRIG).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports Model to repository"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()

        when:
        service.importModel(config, model)

        then:
        (1.._) * conn.add(*_)
    }

    def "Throws exception if repository ID does not exist"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository("missing").build()

        when:
        service.importFile(config, file)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for repository if invalid file type"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()
        File f = new ClassPathResource("importer/testFile.txt").getFile()

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Throws exception for repository if nonexistent file"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()
        File f = new File("importer/FakeFile.trig")

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Imports trig file to dataset without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Imports trig file to dataset with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).format(RDFFormat.TRIG).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Throws exception if dataset record ID does not exist"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(vf.createIRI("http://test.com/missing")).build()

        when:
        service.importFile(config, file)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for dataset if invalid file type"(){
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()
        File f = new ClassPathResource("importer/testFile.txt").getFile()

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Throws exception for dataset if nonexistent file"(){
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()
        File f = new File("importer/FakeFile.trig")

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }
}