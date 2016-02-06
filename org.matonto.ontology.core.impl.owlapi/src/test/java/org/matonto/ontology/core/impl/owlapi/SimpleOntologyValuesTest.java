package org.matonto.ontology.core.impl.owlapi;

import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.*;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.mockStaticPartial;
import static org.powermock.api.easymock.PowerMock.replay;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.ontology.core.api.types.ClassExpressionType;
import org.matonto.ontology.core.api.types.DataRangeType;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.api.types.Facet;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.semanticweb.owlapi.model.NodeID;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAnonymousIndividual;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLFacetRestriction;
import org.semanticweb.owlapi.model.OWLIndividual;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLNamedIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.vocab.OWLFacet;

import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImplString;



@RunWith(PowerMockRunner.class)
@PrepareForTest({SimpleOntologyValues.class, 
    org.semanticweb.owlapi.model.IRI.class,
    NodeID.class,
    ClassExpressionType.class})
public class SimpleOntologyValuesTest {

    ValueFactory factory;
    OntologyManager ontologyManager;
    OWLOntology owlOntology;
    Resource resource;
    OWLOntologyID owlOntologyID;
    IRI ontologyIRI;
    IRI versionIRI;
    org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    org.semanticweb.owlapi.model.IRI owlVersionIRI;

    
    @Before
    public void setUp() {
        factory = mock(ValueFactory.class);
        ontologyManager = mock(OntologyManager.class);       
        owlOntologyIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        owlVersionIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        ontologyIRI = mock(IRI.class);
        versionIRI = mock(IRI.class);

        mockStatic(NodeID.class);
    }
    
    @Test
    public void testMatontoIRI() throws Exception {
        SimpleOntologyValues values = new SimpleOntologyValues();
        values.setValueFactory(factory);
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI).anyTimes();
        replay(factory, SimpleOntologyValues.class);

        assertEquals(ontologyIRI, SimpleOntologyValues.matontoIRI(owlOntologyIRI));
    }
    
    @Test
    public void testOwlapiIRI() throws Exception {
        expect(ontologyIRI.stringValue()).andReturn("http://test.com/ontology1");
        mockStatic(org.semanticweb.owlapi.model.IRI.class);
        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class))).andReturn(owlOntologyIRI);
        replay(ontologyIRI, org.semanticweb.owlapi.model.IRI.class);

        assertEquals(owlOntologyIRI, SimpleOntologyValues.owlapiIRI(ontologyIRI));
    }
    
    @Test
    public void testMatontoAnonymousIndividual() throws Exception {
        OWLAnonymousIndividual owlIndividual = mock(OWLAnonymousIndividual.class);
        NodeID nodeId = mock(NodeID.class);
        expect(nodeId.getID()).andReturn("_:genid123");
        expect(owlIndividual.getID()).andReturn(nodeId);
        replay(owlIndividual, nodeId);
        
        assertEquals("_:genid123", SimpleOntologyValues.matontoAnonymousIndividual(owlIndividual).getId());        
    }
    
    @Test
    public void testOwlapiAnonymousIndividual() throws Exception {
        AnonymousIndividual matontoIndividual = mock(AnonymousIndividual.class);
        NodeID nodeId = mock(NodeID.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        expect(matontoIndividual.getId()).andReturn("_:genid123");
        expect(nodeId.getID()).andReturn("_:genid123");
        expect(NodeID.getNodeID(isA(String.class))).andReturn(nodeId);
        mockStatic(org.semanticweb.owlapi.model.IRI.class);
        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class), isA(String.class))).andReturn(owlIRI).anyTimes();
        replay(matontoIndividual, nodeId, owlIRI, NodeID.class, org.semanticweb.owlapi.model.IRI.class);
        
        assertEquals("_:genid123", SimpleOntologyValues.owlapiAnonymousIndividual(matontoIndividual).getID().getID());        
    }
    
//    @Test
//    public void testMatontoLiteral() throws Exception {
//
//        OWLLiteral owlLiteral = new OWLLiteralImplString("testString");
//        org.semanticweb.owlapi.model.IRI owlIRI = owlLiteral.getDatatype().getIRI();
//        IRI iri = mock(IRI.class);
//        Literal literal = mock(Literal.class);
//        Datatype datatype = mock(Datatype.class);
//        
//        expect(datatype.getIRI()).andReturn(iri).anyTimes();
//        expect(literal.getLabel()).andReturn("testString").anyTimes();
//        expect(iri.stringValue()).andReturn("http://www.w3.org/2001/XMLSchema#string").anyTimes();
//        expect(factory.createLiteral(isA(String.class), isA(IRI.class))).andReturn(literal).anyTimes();
//        
//        mockStaticPartial(SimpleOntologyValues.class, "matontoDatatype");
//        expect(SimpleOntologyValues.matontoDatatype(isA(OWLDatatype.class))).andReturn(datatype).anyTimes();
//        replay(factory, iri, literal, datatype, SimpleOntologyValues.class);
//        
//        assertEquals("testString", SimpleOntologyValues.matontoLiteral(owlLiteral).getLabel());
//        assertEquals(iri, SimpleOntologyValues.matontoLiteral(owlLiteral).getDatatype());
//    }
    
//    @Test
//    public void testOwlapiLiteral() throws Exception {
//        Literal literal = mock(Literal.class);
//        IRI datatypeIRI = mock(IRI.class);
//        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
//        
//        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/2001/XMLSchema#string").anyTimes();
//        expect(literal.getDatatype()).andReturn(datatypeIRI);  
//        expect(literal.getLanguage()).andReturn(Optional.empty());
//        expect(literal.getLabel()).andReturn("test");
//        
//        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
//        expect(SimpleOntologyValues.owlapiIRI(isA(IRI.class))).andReturn(owlIRI);
//        replay(literal, datatypeIRI, SimpleOntologyValues.class);
//        
//        OWLLiteral owlLiteral = SimpleOntologyValues.owlapiLiteral(literal);
//        assertEquals("test", owlLiteral.getLiteral());
//    }
    
    @Test
    public void testEmptyMatontoAnnotation() throws Exception {
        OWLAnnotation owlAnno = mock(OWLAnnotation.class);
        OWLAnnotation owlAnno1 = mock(OWLAnnotation.class);
        Set<OWLAnnotation> mockAnnoSet = new HashSet<>();
          
        expect(owlAnno.getAnnotations()).andReturn(mockAnnoSet).anyTimes();
          
        OWLAnnotationProperty owlProperty = mock(OWLAnnotationProperty.class);
        AnnotationProperty property = mock(AnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI value = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
          
        expect(owlAnno.getProperty()).andReturn(owlProperty).anyTimes();
        expect(owlAnno.getValue()).andReturn(value).anyTimes();
          
        mockStaticPartial(SimpleOntologyValues.class, "matontoAnnotationProperty", "matontoIRI");
        expect(SimpleOntologyValues.matontoAnnotationProperty(owlProperty)).andReturn(property).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(value)).andReturn(iri).anyTimes();
          
        replay(owlAnno, owlAnno1, owlProperty, property, value, iri, SimpleOntologyValues.class);
        
        assertEquals(0, SimpleOntologyValues.matontoAnnotation(owlAnno).getAnnotations().size());
    }
    
//    @Test
//    public void testMatontoAnnotation() throws Exception {
//        OWLAnnotation owlAnno = mock(OWLAnnotation.class);
//        OWLAnnotation owlAnno1 = mock(OWLAnnotation.class);
//        Set<OWLAnnotation> mockAnnoSet = new HashSet<>();
//        mockAnnoSet.add(owlAnno1);
//        
//        expect(owlAnno.getAnnotations()).andReturn(mockAnnoSet).anyTimes();
//        expect(owlAnno1.getAnnotations()).andReturn(new HashSet<>()).anyTimes();
//        
//        OWLAnnotationProperty owlProperty = mock(OWLAnnotationProperty.class);
//        AnnotationProperty property = mock(AnnotationProperty.class);
//        org.semanticweb.owlapi.model.IRI value = mock(org.semanticweb.owlapi.model.IRI.class);
//        OWLAnnotationProperty owlProperty1 = mock(OWLAnnotationProperty.class);
//        AnnotationProperty property1 = mock(AnnotationProperty.class);
//        org.semanticweb.owlapi.model.IRI value1 = mock(org.semanticweb.owlapi.model.IRI.class);
//        IRI iri = mock(IRI.class);
//        IRI iri1 = mock(IRI.class);
//        
//        expect(owlAnno.getProperty()).andReturn(owlProperty).anyTimes();
//        expect(owlAnno1.getProperty()).andReturn(owlProperty1).anyTimes();
//        expect(owlAnno.getValue()).andReturn(value).anyTimes();
//        expect(owlAnno1.getValue()).andReturn(value1).anyTimes();
//        mockStaticPartial(SimpleOntologyValues.class, "matontoAnnotationProperty", "matontoIRI");
//        expect(SimpleOntologyValues.matontoAnnotationProperty(owlProperty)).andReturn(property).anyTimes();
//        expect(SimpleOntologyValues.matontoAnnotationProperty(owlProperty1)).andReturn(property1);
//        expect(SimpleOntologyValues.matontoIRI(value)).andReturn(iri).anyTimes();
//        expect(SimpleOntologyValues.matontoIRI(value1)).andReturn(iri1).anyTimes();
//        
//        replay(owlAnno, owlAnno1, owlProperty, property, value, owlProperty1, property1, value1, iri, iri1, SimpleOntologyValues.class);
//        
//        assertEquals(2, SimpleOntologyValues.matontoAnnotation(owlAnno).getAnnotations().size());
//    }
    
    @Test
    public void testEmptyOwlapiAnnotation() throws Exception {
        Annotation anno = mock(Annotation.class);
        Set<Annotation> mockAnnoSet = new HashSet<>();
        AnnotationProperty property = mock(AnnotationProperty.class);
        OWLAnnotationProperty owlProperty = mock(OWLAnnotationProperty.class);
        IRI value = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(anno.isAnnotated()).andReturn(false);
        expect(anno.getAnnotations()).andReturn(mockAnnoSet);
        expect(anno.getProperty()).andReturn(property);
        expect(anno.getValue()).andReturn(value).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiAnnotationProperty", "owlapiIRI");
        expect(SimpleOntologyValues.owlapiAnnotationProperty(property)).andReturn(owlProperty).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(value)).andReturn(owlIRI).anyTimes();
        
        replay(anno, property, owlProperty, value,owlIRI, SimpleOntologyValues.class);
        
        assertEquals(0, SimpleOntologyValues.owlapiAnnotation(anno).getAnnotations().size());      
    }
    
    @Test
    public void testOwlapiAnnotation() throws Exception {
        
    }
    
    @Test
    public void testMatontoNamedIndividual() throws Exception {
        OWLNamedIndividual owlIndividual = mock(OWLNamedIndividual.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(owlIndividual.getIRI()).andReturn(owlIRI);
        replay(owlIndividual, owlIRI);
        
        assertEquals(EntityType.NAMED_INDIVIDUAL, SimpleOntologyValues.matontoNamedIndividual(owlIndividual).getEntityType());
    }
    
    @Test
    public void testOwlapiNamedIndividual() throws Exception {
        NamedIndividual matontoIndividual = mock(NamedIndividual.class);
        IRI matontoIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(matontoIndividual.getIRI()).andReturn(matontoIRI);
        expect(matontoIRI.stringValue()).andReturn("http://www.test.com/owlapiNamedIndividual");
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(isA(IRI.class))).andReturn(owlIRI);
        replay(matontoIndividual, matontoIRI, SimpleOntologyValues.class);
        
        assertTrue(SimpleOntologyValues.owlapiNamedIndividual(matontoIndividual).isOWLNamedIndividual());
    }
    
    @Test
    public void testMatontoIndividual() throws Exception {
        OWLAnonymousIndividual owlAnonymous = mock(OWLAnonymousIndividual.class);
        OWLNamedIndividual owlNamed = mock(OWLNamedIndividual.class);
        AnonymousIndividual anonymous = mock(AnonymousIndividual.class);
        NamedIndividual named = mock(NamedIndividual.class);
        
        expect(anonymous.isAnonymous()).andReturn(true);
        expect(anonymous.isNamed()).andReturn(false);
        expect(named.isNamed()).andReturn(true);
        expect(named.isAnonymous()).andReturn(false);
        mockStaticPartial(SimpleOntologyValues.class, "matontoAnonymousIndividual", "matontoNamedIndividual");
        expect(SimpleOntologyValues.matontoAnonymousIndividual(owlAnonymous)).andReturn(anonymous).anyTimes();
        expect(SimpleOntologyValues.matontoNamedIndividual(owlNamed)).andReturn(named).anyTimes();
        
        replay(owlAnonymous, owlNamed, anonymous, named, SimpleOntologyValues.class);
              
        assertTrue(SimpleOntologyValues.matontoIndividual(owlAnonymous).isAnonymous());
        assertFalse(SimpleOntologyValues.matontoIndividual(owlAnonymous).isNamed());
        assertTrue(SimpleOntologyValues.matontoIndividual(owlNamed).isNamed());
        assertFalse(SimpleOntologyValues.matontoIndividual(owlNamed).isAnonymous());
    }
    
    @Test
    public void testOwlapiIndividual() throws Exception {
        OWLAnonymousIndividual owlAnonymous = mock(OWLAnonymousIndividual.class);
        OWLNamedIndividual owlNamed = mock(OWLNamedIndividual.class);
        AnonymousIndividual anonymous = mock(AnonymousIndividual.class);
        NamedIndividual named = mock(NamedIndividual.class);
        
        expect(owlAnonymous.isAnonymous()).andReturn(true);
        expect(owlAnonymous.isNamed()).andReturn(false);
        expect(owlNamed.isNamed()).andReturn(true);
        expect(owlNamed.isAnonymous()).andReturn(false);
        mockStaticPartial(SimpleOntologyValues.class, "owlapiAnonymousIndividual", "owlapiNamedIndividual");
        expect(SimpleOntologyValues.owlapiAnonymousIndividual(anonymous)).andReturn(owlAnonymous).anyTimes();
        expect(SimpleOntologyValues.owlapiNamedIndividual(named)).andReturn(owlNamed).anyTimes();
        
        replay(owlAnonymous, owlNamed, anonymous, named, SimpleOntologyValues.class);
              
        assertTrue(SimpleOntologyValues.owlapiIndividual(anonymous).isAnonymous());
        assertFalse(SimpleOntologyValues.owlapiIndividual(anonymous).isNamed());
        assertTrue(SimpleOntologyValues.owlapiIndividual(named).isNamed());
        assertFalse(SimpleOntologyValues.owlapiIndividual(named).isAnonymous());
    }
    
    @Test
    public void testMatontoOntologyId() throws Exception {
        OWLOntologyID owlId = mock(OWLOntologyID.class);
        org.semanticweb.owlapi.model.IRI oIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        org.semanticweb.owlapi.model.IRI vIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI moIRI = mock(IRI.class);
        IRI mvIRI = mock(IRI.class);
        
        expect(owlId.getOntologyIRI()).andReturn(com.google.common.base.Optional.of(oIRI)).anyTimes();
        expect(owlId.getVersionIRI()).andReturn(com.google.common.base.Optional.of(vIRI)).anyTimes();
        expect(moIRI.stringValue()).andReturn("http://www.test.com/ontology").anyTimes();
        expect(mvIRI.stringValue()).andReturn("http://www.test.com/ontology/1.0.0").anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI");
        expect(SimpleOntologyValues.matontoIRI(oIRI)).andReturn(moIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(vIRI)).andReturn(mvIRI).anyTimes();
        
        mockStatic(org.semanticweb.owlapi.model.IRI.class);
        expect(org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology")).andReturn(oIRI).anyTimes();
        expect(org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology/1.0.0")).andReturn(vIRI).anyTimes();
        expect(NodeID.isAnonymousNodeIRI(isA(org.semanticweb.owlapi.model.IRI.class))).andReturn(false).anyTimes();
        
        replay(factory, owlId, oIRI, vIRI, moIRI, mvIRI, SimpleOntologyValues.class, NodeID.class, org.semanticweb.owlapi.model.IRI.class);
        
        assertEquals("http://www.test.com/ontology", SimpleOntologyValues.matontoOntologyId(owlId).getOntologyIRI().get().stringValue());
        assertEquals("http://www.test.com/ontology/1.0.0", SimpleOntologyValues.matontoOntologyId(owlId).getVersionIRI().get().stringValue());
    }
    
    @Test
    public void testOwlapiOntologyId() throws Exception {
        SimpleOntologyId simpleId1 = mock(SimpleOntologyId.class);
        OWLOntologyID owlId = mock(OWLOntologyID.class);
        OntologyId simpleId2 = mock(OntologyId.class);
        
        expect(simpleId1.getOwlapiOntologyId()).andReturn(owlId);
        expect(simpleId2.getOntologyIRI()).andReturn(Optional.of(ontologyIRI)).anyTimes();
        expect(simpleId2.getVersionIRI()).andReturn(Optional.of(versionIRI)).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(owlOntologyIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(owlVersionIRI).anyTimes();
        
        expect(NodeID.isAnonymousNodeIRI(isA(org.semanticweb.owlapi.model.IRI.class))).andReturn(false).anyTimes();
        
        replay(simpleId1, simpleId2, owlId, ontologyIRI, versionIRI, SimpleOntologyValues.class, NodeID.class);
        
        assertEquals(owlId, SimpleOntologyValues.owlapiOntologyId(simpleId1));
        assertEquals(owlOntologyIRI, SimpleOntologyValues.owlapiOntologyId(simpleId2).getOntologyIRI().get());
        assertEquals(owlVersionIRI, SimpleOntologyValues.owlapiOntologyId(simpleId2).getVersionIRI().get());
    }
    
    @Test
    public void testMatontoClass() throws Exception {
        OWLClass owlapiClass = mock(OWLClass.class);
        IRI classIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlClassIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(owlapiClass.getIRI()).andReturn(owlClassIRI).anyTimes();

        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI", "owlapiIRI");
        expect(SimpleOntologyValues.matontoIRI(owlClassIRI)).andReturn(classIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(classIRI)).andReturn(owlClassIRI).anyTimes();
        expect(classIRI.stringValue()).andReturn("http://www.test.com/ontologyClass").anyTimes();
        expect(owlClassIRI.getNamespace()).andReturn(ontologyIRI.getNamespace()).anyTimes();
        
        replay(owlapiClass, owlClassIRI, classIRI, SimpleOntologyValues.class);
        
        assertEquals(classIRI, SimpleOntologyValues.matontoClass(owlapiClass).getIRI());
    }
    
    @Test
    public void testOwlapiClass() throws Exception {
        OClass matontoClass = mock(OClass.class);
        IRI classIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlClassIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(matontoClass.getIRI()).andReturn(classIRI).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(classIRI)).andReturn(owlClassIRI).anyTimes();
        expect(owlClassIRI.getNamespace()).andReturn(ontologyIRI.getNamespace()).anyTimes();
        
        replay(matontoClass, owlClassIRI, classIRI, SimpleOntologyValues.class);
        
        assertEquals(owlClassIRI, SimpleOntologyValues.owlapiClass(matontoClass).getIRI());       
    }
    
//    @Test
//    public void testMatontoDatatype() throws Exception {
//        OWLDatatype owlDatatype = mock(OWLDatatype.class);
//        org.semanticweb.owlapi.model.IRI owlDatatypeIRI = mock(org.semanticweb.owlapi.model.IRI.class);
//        IRI datatypeIRI = mock(IRI.class);
//        
//        expect(owlDatatype.getIRI()).andReturn(owlDatatypeIRI).anyTimes();
//        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral").anyTimes();
//        
//        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI", "owlapiIRI");
//        expect(SimpleOntologyValues.matontoIRI(owlDatatypeIRI)).andReturn(datatypeIRI).anyTimes();
//        expect(SimpleOntologyValues.owlapiIRI(datatypeIRI)).andReturn(owlDatatypeIRI).anyTimes();
//        
//        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class), isA(String.class))).andReturn(owlDatatypeIRI).anyTimes();
//
//        replay(owlDatatype, owlDatatypeIRI, datatypeIRI, SimpleOntologyValues.class, org.semanticweb.owlapi.model.IRI.class);
//        
//        assertEquals(datatypeIRI, SimpleOntologyValues.matontoDatatype(owlDatatype).getIRI());
//    }
    
//    @Test
//    public void testOwlapiDatatype() throws Exception {
//        Datatype datatype = mock(Datatype.class);
//        IRI datatypeIRI = mock(IRI.class);
//        org.semanticweb.owlapi.model.IRI owlDatatypeIRI = mock(org.semanticweb.owlapi.model.IRI.class);
//        
//        expect(datatype.getIRI()).andReturn(datatypeIRI).anyTimes();
//        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral").anyTimes();
//        
//        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
//        expect(SimpleOntologyValues.owlapiIRI(datatypeIRI)).andReturn(owlDatatypeIRI).anyTimes();
//        
//        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class), isA(String.class))).andReturn(owlDatatypeIRI).anyTimes();
//        replay(datatype, owlDatatypeIRI, datatypeIRI, SimpleOntologyValues.class, org.semanticweb.owlapi.model.IRI.class);
//        
//        assertEquals(owlDatatypeIRI, SimpleOntologyValues.owlapiDatatype(datatype).getIRI());
//    }
    
    @Test
    public void testMatontoAxiomType() throws Exception {
        org.semanticweb.owlapi.model.AxiomType owlType1 = org.semanticweb.owlapi.model.AxiomType.CLASS_ASSERTION;
        org.semanticweb.owlapi.model.AxiomType owlType2 = org.semanticweb.owlapi.model.AxiomType.DATA_PROPERTY_ASSERTION;
        org.semanticweb.owlapi.model.AxiomType owlType3 = org.semanticweb.owlapi.model.AxiomType.DECLARATION;
        org.semanticweb.owlapi.model.AxiomType owlType4 = org.semanticweb.owlapi.model.AxiomType.NEGATIVE_DATA_PROPERTY_ASSERTION;
        
        assertEquals("ClassAssertion", SimpleOntologyValues.matontoAxiomType(owlType1).getName());
        assertEquals("DataPropertyAssertion", SimpleOntologyValues.matontoAxiomType(owlType2).getName());
        assertEquals("Declaration", SimpleOntologyValues.matontoAxiomType(owlType3).getName());
        assertEquals("NegativeDataPropertyAssertion", SimpleOntologyValues.matontoAxiomType(owlType4).getName());
        assertEquals(null, SimpleOntologyValues.matontoAxiomType(null));
    }
    
    @Test
    public void testOwlapiAxiomType() throws Exception {
        AxiomType axiomType1 = AxiomType.ASYMMETRIC_OBJECT_PROPERTY;
        AxiomType axiomType2 = AxiomType.DISJOINT_CLASSES;
        AxiomType axiomType3 = AxiomType.DECLARATION;
        AxiomType axiomType4 = AxiomType.INVERSE_FUNCTIONAL_OBJECT_PROPERTY;
        
        assertEquals(axiomType1.getName(), SimpleOntologyValues.owlapiAxiomType(axiomType1).getName());
        assertEquals(axiomType2.getName(), SimpleOntologyValues.owlapiAxiomType(axiomType2).getName());
        assertEquals(axiomType3.getName(), SimpleOntologyValues.owlapiAxiomType(axiomType3).getName());
        assertEquals(axiomType4.getName(), SimpleOntologyValues.owlapiAxiomType(axiomType4).getName());
        assertEquals(null, SimpleOntologyValues.owlapiAxiomType(null));
    }
    
    @Test
    public void testMatontoEntityType() throws Exception {
        org.semanticweb.owlapi.model.EntityType entityType1 = org.semanticweb.owlapi.model.EntityType.ANNOTATION_PROPERTY;
        org.semanticweb.owlapi.model.EntityType entityType2 = org.semanticweb.owlapi.model.EntityType.NAMED_INDIVIDUAL;
        org.semanticweb.owlapi.model.EntityType entityType3 = org.semanticweb.owlapi.model.EntityType.CLASS;
        
        assertEquals("AnnotationProperty", SimpleOntologyValues.matontoEntityType(entityType1).getName());
        assertEquals("NamedIndividual", SimpleOntologyValues.matontoEntityType(entityType2).getName());
        assertEquals("Class", SimpleOntologyValues.matontoEntityType(entityType3).getName());       
    }
    
    @Test
    public void testOwlapiEntityType() throws Exception {
        EntityType entityType1 = EntityType.OBJECT_PROPERTY;
        EntityType entityType2 = EntityType.DATATYPE;
        EntityType entityType3 = EntityType.DATA_PROPERTY;
                
        assertEquals(entityType1.getName(), SimpleOntologyValues.owlapiEntityType(entityType1).getName());
        assertEquals(entityType2.getName(), SimpleOntologyValues.owlapiEntityType(entityType2).getName());
        assertEquals(entityType3.getName(), SimpleOntologyValues.owlapiEntityType(entityType3).getName());
        assertEquals(null, SimpleOntologyValues.owlapiEntityType(null));
    }
    
//    @Test
//    public void testMatontoClassExpressionType() throws Exception {
//        org.semanticweb.owlapi.model.ClassExpressionType expressionType1 = org.semanticweb.owlapi.model.ClassExpressionType.DATA_SOME_VALUES_FROM;
//        org.semanticweb.owlapi.model.ClassExpressionType expressionType2 = org.semanticweb.owlapi.model.ClassExpressionType.DATA_EXACT_CARDINALITY;
//        org.semanticweb.owlapi.model.ClassExpressionType expressionType3 = org.semanticweb.owlapi.model.ClassExpressionType.OBJECT_HAS_VALUE;
//        org.semanticweb.owlapi.model.ClassExpressionType expressionType4 = org.semanticweb.owlapi.model.ClassExpressionType.OWL_CLASS;
        
//        ClassExpressionType type = ClassExpressionType.DATA_ALL_VALUES_FROM;
//        expect(type.valueOf(isA(String.class))).andReturn(ClassExpressionType.DATA_SOME_VALUES_FROM);
//             
//        IRI iri1 = mock(IRI.class);
//        expect(factory.createIRI(isA(String.class), isA(String.class))).andReturn(iri1).anyTimes();
//        replay(factory, iri1, ClassExpressionType.class);       
//        
//        type.setValueFactory(factory);
//        assertEquals(expressionType1.getName(), SimpleOntologyValues.matontoClassExpressionType(expressionType1).getName());
//        assertEquals(expressionType2.getName(), SimpleOntologyValues.matontoClassExpressionType(expressionType2).getName());
//        assertEquals(expressionType3.getName(), SimpleOntologyValues.matontoClassExpressionType(expressionType3).getName());
//        assertEquals(expressionType4.getName(), SimpleOntologyValues.matontoClassExpressionType(expressionType4).getName());       
//    }
    
//    @Test
//    public void testOwlapiClassExpressionType() throws Exception {
//        ClassExpressionType expressionType1 = ClassExpressionType.DATA_ALL_VALUES_FROM;
//        ClassExpressionType expressionType2 = ClassExpressionType.OBJECT_ALL_VALUES_FROM;
//        ClassExpressionType expressionType3 = ClassExpressionType.OWL_CLASS;
//        ClassExpressionType expressionType4 = ClassExpressionType.OBJECT_EXACT_CARDINALITY;
//        
//        assertEquals(expressionType1.getName(), SimpleOntologyValues.owlapiClassExpressionType(expressionType1).getName());
//        assertEquals(expressionType2.getName(), SimpleOntologyValues.owlapiClassExpressionType(expressionType1).getName());
//        assertEquals(expressionType3.getName(), SimpleOntologyValues.owlapiClassExpressionType(expressionType1).getName());
//        assertEquals(expressionType4.getName(), SimpleOntologyValues.owlapiClassExpressionType(expressionType1).getName());       
//    }
    
//    @Test
//    public void testMatontoDataRangeType() throws Exception {
//        org.semanticweb.owlapi.model.DataRangeType type1 = org.semanticweb.owlapi.model.DataRangeType.DATA_COMPLEMENT_OF;
//        org.semanticweb.owlapi.model.DataRangeType type2 = org.semanticweb.owlapi.model.DataRangeType.DATATYPE;
//        org.semanticweb.owlapi.model.DataRangeType type3 = org.semanticweb.owlapi.model.DataRangeType.DATATYPE_RESTRICTION;
//        
//        assertEquals(type1.getName(), SimpleOntologyValues.matontoDataRangeType(type1).getName());
//        assertEquals(type2.getName(), SimpleOntologyValues.matontoDataRangeType(type2).getName());
//        assertEquals(type3.getName(), SimpleOntologyValues.matontoDataRangeType(type3).getName());
//    }
    
//    @Test
//    public void testOwlapiDataRangeType() throws Exception {
//        DataRangeType type1 = DataRangeType.DATA_COMPLEMENT_OF;
//        DataRangeType type2 = DataRangeType.DATATYPE;
//        DataRangeType type3 = DataRangeType.DATATYPE_RESTRICTION;
//        
//        assertEquals(type1.getName(), SimpleOntologyValues.owlapiDataRangeType(type1).getName());
//        assertEquals(type2.getName(), SimpleOntologyValues.owlapiDataRangeType(type2).getName());
//        assertEquals(type3.getName(), SimpleOntologyValues.owlapiDataRangeType(type3).getName());
//    }
    
//    @Test
//    public void testMatontoFacet() throws Exception {
//        OWLFacet facet1 = OWLFacet.FRACTION_DIGITS;
//        OWLFacet facet2 = OWLFacet.LENGTH;
//        OWLFacet facet3 = OWLFacet.MIN_EXCLUSIVE;
//        
//        assertEquals(facet1.getShortForm(), SimpleOntologyValues.matontoFacet(facet1).getShortForm());
//        assertEquals(facet2.getShortForm(), SimpleOntologyValues.matontoFacet(facet2).getShortForm());
//        assertEquals(facet3.getShortForm(), SimpleOntologyValues.matontoFacet(facet3).getShortForm());
//    }
    
//    @Test
//    public void testOwlapiFacet() throws Exception {
//        Facet facet1 = Facet.FRACTION_DIGITS;
//        Facet facet2 = Facet.LENGTH;
//        Facet facet3 = Facet.MAX_INCLUSIVE;
//        
//        assertEquals(facet1.getShortForm(), SimpleOntologyValues.owlapiFacet(facet1).getShortForm());
//        assertEquals(facet2.getShortForm(), SimpleOntologyValues.owlapiFacet(facet2).getShortForm());
//        assertEquals(facet3.getShortForm(), SimpleOntologyValues.owlapiFacet(facet3).getShortForm());
//    }
    
//    @Test
//    public void testMatontoFacetRestriction() throws Exception {
//        OWLFacetRestriction owlRestriction = mock(OWLFacetRestriction.class);
//        OWLFacet owlFacet = OWLFacet.FRACTION_DIGITS;
//        Facet facet = Facet.FRACTION_DIGITS;
//        OWLLiteral owlLiteral = mock(OWLLiteral.class);
//        Literal literal = mock(Literal.class);
//        
//        expect(owlRestriction.getFacet()).andReturn(owlFacet);
//        expect(owlRestriction.getFacetValue()).andReturn(owlLiteral);
//        
//        mockStaticPartial(SimpleOntologyValues.class, "matontoFacet", "matontoLiteral");
//        expect(SimpleOntologyValues.matontoFacet(owlFacet)).andReturn(facet);
//        expect(SimpleOntologyValues.matontoLiteral(owlLiteral)).andReturn(literal);
//        
//        replay(owlRestriction, owlFacet, facet, owlLiteral, literal, SimpleOntologyValues.class);
//        
//        assertEquals(facet, SimpleOntologyValues.matontoFacetRestriction(owlRestriction).getFacet());
//        assertEquals(literal, SimpleOntologyValues.matontoFacetRestriction(owlRestriction).getFacetValue());
//    }
    
    @Test
    public void testOwlapiFacetRestriction() throws Exception {
        
    }
    
    @Test
    public void testMatontoDataOneOf() throws Exception {
        
    }
    
    @Test
    public void testOwlapiDataOneOf() throws Exception {
        
    }
    
    @Test
    public void testMatontoObjectProperty() throws Exception {
        OWLObjectProperty property = mock(OWLObjectProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI");
        expect(SimpleOntologyValues.matontoIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(iri, SimpleOntologyValues.matontoObjectProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiObjectProperty() throws Exception {
        ObjectProperty property = mock(ObjectProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiObjectProperty(property).getIRI());
    }
    
    @Test
    public void testMatontoDataProperty() throws Exception {
        OWLDataProperty property = mock(OWLDataProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI");
        expect(SimpleOntologyValues.matontoIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(iri, SimpleOntologyValues.matontoDataProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiDataProperty() throws Exception {
        DataProperty property = mock(DataProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiDataProperty(property).getIRI());
    }
    
    @Test
    public void testMatontoAnnotationProperty() throws Exception {
        OWLAnnotationProperty property = mock(OWLAnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "matontoIRI");
        expect(SimpleOntologyValues.matontoIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(iri, SimpleOntologyValues.matontoAnnotationProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiAnnotationProperty() throws Exception {
        AnnotationProperty property = mock(AnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiAnnotationProperty(property).getIRI());
    }
    
    @Test
    public void testMatontoDeclarationAxiom() throws Exception {
        
    }
    
    @Test
    public void testOwlapiDeclarationAxiom() throws Exception {
        
    }
}
