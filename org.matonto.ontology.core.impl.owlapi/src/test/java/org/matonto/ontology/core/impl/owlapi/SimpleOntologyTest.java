package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.when;

import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.Set;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyTest {
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private File restrictionFile;

    OntologyId ontologyIdMock;
    OntologyManager ontologyManager;
    SesameTransformer transformer;
    IRI ontologyIRI;
    IRI versionIRI;

    @Before
    public void setUp() throws Exception {
        restrictionFile = Paths.get(getClass().getResource("/restriction-test-ontology.ttl").toURI()).toFile();

        ontologyIdMock = mock(OntologyId.class);
        transformer = mock(SesameTransformer.class);
        ontologyManager = mock(OntologyManager.class);

        ontologyIRI = mock(IRI.class);
        when(ontologyIRI.stringValue()).thenReturn("http://test.com/ontology1");

        versionIRI = mock(IRI.class);
        when(versionIRI.stringValue()).thenReturn("http://test.com/ontology1/1.0.0");

        mockStatic(SimpleOntologyValues.class);

        when(SimpleOntologyValues.owlapiIRI(any(IRI.class))).thenAnswer(i -> org.semanticweb.owlapi.model.IRI.create(i.getArgumentAt(0, IRI.class).stringValue()));
        when(SimpleOntologyValues.matontoIRI(any(org.semanticweb.owlapi.model.IRI.class))).thenReturn(mock(IRI.class));
        when(SimpleOntologyValues.owlapiClass(any(OClass.class))).thenAnswer(i -> new OWLClassImpl(org.semanticweb.owlapi.model.IRI.create(i.getArgumentAt(0, OClass.class).getIRI().stringValue())));
        when(SimpleOntologyValues.matontoObjectProperty(any(OWLObjectProperty.class))).thenAnswer(i -> new SimpleObjectProperty(vf.createIRI(i.getArgumentAt(0, OWLObjectProperty.class).getIRI().toString())));
        when(SimpleOntologyValues.matontoDataProperty(any(OWLDataProperty.class))).thenAnswer(i -> new SimpleDataProperty(vf.createIRI(i.getArgumentAt(0, OWLDataProperty.class).getIRI().toString())));

        when(ontologyIdMock.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyIdMock.getVersionIRI()).thenReturn(Optional.of(versionIRI));

        when(ontologyManager.createOntologyId(any(IRI.class), any(IRI.class))).thenReturn(ontologyIdMock);
        when(ontologyManager.createOntologyId(any(IRI.class))).thenReturn(ontologyIdMock);
    }

    @Test
    public void testGetOntologyIdReturnsAnEqualObject() throws Exception {
        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        assertEquals(ontologyIdMock, ontology.getOntologyId());
    }

    @Test
    public void testStreamConstructor() throws Exception {
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test
    public void testFileConstructor() throws Exception {
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test
    public void testEquals() throws Exception {
        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/test.owl");
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);

        Ontology ontology3 = new SimpleOntology(file, ontologyManager, transformer);
        Ontology ontology4 = new SimpleOntology(file, ontologyManager, transformer);

        Ontology ontology5 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology6 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertEquals(ontology1, ontology2);
        assertEquals(ontology3, ontology4);
        assertEquals(ontology3, ontology5);
        assertEquals(ontology5, ontology6);
    }

    @Test
    public void testNotEquals() throws Exception {
        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/travel.owl");

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology3 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertNotEquals(ontology1, ontology2);
        assertNotEquals(ontology1, ontology3);
        assertNotEquals(ontology2, ontology3);
    }

    @Test
    @Ignore
    public void testHashCode() throws Exception {
        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/test.owl");
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);

        Ontology ontology3 = new SimpleOntology(file, ontologyManager, transformer);
        Ontology ontology4 = new SimpleOntology(file, ontologyManager, transformer);

        Ontology ontology5 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology6 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertEquals(ontology1.hashCode(), ontology2.hashCode());
        assertEquals(ontology3.hashCode(), ontology4.hashCode());
        assertEquals(ontology3.hashCode(), ontology5.hashCode());
        assertEquals(ontology5.hashCode(), ontology6.hashCode());
    }

    @Test
    public void annotationsAreEmptyForEmptyOntology() throws Exception {
        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Set<Annotation> annotations = ontology.getOntologyAnnotations();
        assertTrue(annotations.size() == 0);
    }

    @Test
    public void annotationsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        when(SimpleOntologyValues.matontoAnnotation(any(OWLAnnotation.class))).thenReturn(mock(Annotation.class));

        // Setup
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);

        // Test
        Set<Annotation> annotations = ontology.getOntologyAnnotations();

        // Assertions
        assertTrue(annotations.size() == 1);
    }

    @Test
    public void axiomsAreEmptyForEmptyOntology() throws Exception {
        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Set<Axiom> axioms = ontology.getAxioms();
        assertTrue(axioms.size() == 0);
    }

    @Test
    public void axiomsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        when(SimpleOntologyValues.matontoAxiom(any(OWLAxiom.class))).thenReturn(mock(Axiom.class));

        // Setup
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);

        // Test
        Set<Axiom> axioms = ontology.getAxioms();

        // Assertions
        assertTrue(axioms.size() == 1);
    }
    
    @Test
    public void missingDirectImportTest() throws Exception {
        File file = Paths.get(getClass().getResource("/protegeSample.owl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);
        assertEquals(5, ontology.getUnloadableImportIRIs().size());
    }

    @Test
    public void getCardinalityPropertiesTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionFile, ontologyManager, transformer);
        assertEquals(0, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Woman")).size());
    }

    @Test
    public void getCardinalityPropertiesOfSubClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionFile, ontologyManager, transformer);
        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Parent")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionFile, ontologyManager, transformer);
        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Person")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassAndSubClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionFile, ontologyManager, transformer);
        assertEquals(2, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Man")).size());
    }

    // TODO: Test asModel

    // TODO: Test asTurtle

    // TODO: Test asRdfXml

    // TODO: Test asOwlXml

    // TODO: Test asJsonLD
}
