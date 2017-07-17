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

import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.classexpression.CardinalityRestriction;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.api.propertyexpression.PropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleCardinalityRestriction;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleClass;
import org.matonto.ontology.core.utils.MatOntoStringUtils;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.openrdf.model.util.Models;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.Rio;
import org.openrdf.rio.WriterConfig;
import org.openrdf.rio.helpers.JSONLDMode;
import org.openrdf.rio.helpers.JSONLDSettings;
import org.openrdf.rio.helpers.StatementCollector;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.PrefixDocumentFormatImpl;
import org.semanticweb.owlapi.formats.RDFXMLDocumentFormat;
import org.semanticweb.owlapi.formats.TurtleDocumentFormat;
import org.semanticweb.owlapi.io.IRIDocumentSource;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.io.OWLParser;
import org.semanticweb.owlapi.io.OWLParserFactory;
import org.semanticweb.owlapi.model.AddImport;
import org.semanticweb.owlapi.model.AsOWLClass;
import org.semanticweb.owlapi.model.AsOWLDatatype;
import org.semanticweb.owlapi.model.HasDomain;
import org.semanticweb.owlapi.model.HasRange;
import org.semanticweb.owlapi.model.MissingImportHandlingStrategy;
import org.semanticweb.owlapi.model.MissingImportListener;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLClassExpressionVisitor;
import org.semanticweb.owlapi.model.OWLDataCardinalityRestriction;
import org.semanticweb.owlapi.model.OWLDataExactCardinality;
import org.semanticweb.owlapi.model.OWLDataMaxCardinality;
import org.semanticweb.owlapi.model.OWLDataMinCardinality;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLObjectCardinalityRestriction;
import org.semanticweb.owlapi.model.OWLObjectExactCardinality;
import org.semanticweb.owlapi.model.OWLObjectMaxCardinality;
import org.semanticweb.owlapi.model.OWLObjectMinCardinality;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLObjectSomeValuesFrom;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.model.OWLPropertyDomainAxiom;
import org.semanticweb.owlapi.model.parameters.Imports;
import org.semanticweb.owlapi.model.parameters.OntologyCopy;
import org.semanticweb.owlapi.reasoner.OWLReasoner;
import org.semanticweb.owlapi.reasoner.OWLReasonerFactory;
import org.semanticweb.owlapi.reasoner.structural.StructuralReasonerFactory;
import org.semanticweb.owlapi.rio.RioJsonLDParserFactory;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioRenderer;
import org.semanticweb.owlapi.util.OWLOntologyWalker;
import org.semanticweb.owlapi.util.OWLOntologyWalkerVisitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nonnull;


public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);

    private OntologyId ontologyId;
    private OntologyManager ontologyManager;
    private SesameTransformer transformer;
    private Set<Annotation> ontoAnnotations;
    private Set<Annotation> annotations;
    private Set<AnnotationProperty> annotationProperties;
    private Set<IRI> missingImports = new HashSet<>();

    //Owlapi variables
    private OWLOntology owlOntology;
    // Instance initialization block sets MissingImportListener for handling missing imports for an ontology.
    private final OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
            .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
    private final OWLOntologyManager owlManager = OWLManager.createOWLOntologyManager();

    {
        owlManager.addMissingImportListener((MissingImportListener) arg0 -> {
            missingImports.add(SimpleOntologyValues.matontoIRI(arg0.getImportedOntologyURI()));
            LOG.warn("Missing import {} ", arg0.getImportedOntologyURI());
        });
        owlManager.setOntologyLoaderConfiguration(config);
    }

    /**
     * .
     */
    public SimpleOntology(OntologyId ontologyId, OntologyManager ontologyManager, SesameTransformer transformer)
            throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.ontologyId = ontologyId;
        this.transformer = transformer;

        try {
            Optional<org.semanticweb.owlapi.model.IRI> owlOntIRI = Optional.empty();
            Optional<org.semanticweb.owlapi.model.IRI> owlVerIRI = Optional.empty();
            Optional<IRI> matOntIRI = ontologyId.getOntologyIRI();
            Optional<IRI> matVerIRI = ontologyId.getVersionIRI();

            if (matOntIRI.isPresent()) {
                owlOntIRI = Optional.of(SimpleOntologyValues.owlapiIRI(matOntIRI.get()));
                if (matVerIRI.isPresent()) {
                    owlVerIRI = Optional.of(SimpleOntologyValues.owlapiIRI(matVerIRI.get()));
                }
            }

            OWLOntologyID owlOntologyID = new OWLOntologyID(owlOntIRI, owlVerIRI);
            owlOntology = owlManager.createOntology(owlOntologyID);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }
    }

    /**
     * .
     */
    public SimpleOntology(InputStream inputStream, OntologyManager ontologyManager, SesameTransformer transformer)
            throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;

        try {
            owlOntology = owlManager.loadOntologyFromOntologyDocument(inputStream);
            createOntologyId(null);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    /**
     * .
     */
    public SimpleOntology(File file, OntologyManager ontologyManager, SesameTransformer transformer)
            throws MatontoOntologyException,
            FileNotFoundException {
        this(new FileInputStream(file), ontologyManager, transformer);
    }

    /**
     * .
     */
    public SimpleOntology(IRI iri, SimpleOntologyManager ontologyManager, SesameTransformer transformer)
            throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;

        try {
            OWLOntologyDocumentSource documentSource = new IRIDocumentSource(SimpleOntologyValues.owlapiIRI(iri));
            owlOntology = owlManager.loadOntologyFromOntologyDocument(documentSource, config);
            createOntologyId(null);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }
    }

    /**
     * .
     */
    public SimpleOntology(String json, OntologyManager ontologyManager, SesameTransformer transformer)
            throws MatontoOntologyException {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;

        OWLParserFactory factory = new RioJsonLDParserFactory();
        OWLParser parser = factory.createParser();

        try {
            OWLOntologyDocumentSource source = new RioMemoryTripleSource(
                    Rio.parse(new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)), "", RDFFormat.JSONLD));
            owlOntology = owlManager.createOntology();
            parser.parse(source, owlOntology, config);
            createOntologyId(null);
        } catch (IOException | RDFParseException | OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }

    }

    protected SimpleOntology(OWLOntology ontology, Resource resource, OntologyManager ontologyManager,
                             SesameTransformer transformer) {
        this.ontologyManager = ontologyManager;
        this.transformer = transformer;

        try {
            owlOntology = owlManager.copyOntology(ontology, OntologyCopy.DEEP);

            // Copy Imports
            ontology.importsDeclarations().forEach(declaration -> {
                this.owlManager.makeLoadImportRequest(declaration, config);
                this.owlManager.applyChange(new AddImport(this.owlOntology, declaration));
            });
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyException("Error in ontology creation", e);
        }

        createOntologyId(resource);
    }

    private void createOntologyId(Resource resource) {
        Optional<org.semanticweb.owlapi.model.IRI> owlOntIRI = owlOntology.getOntologyID().getOntologyIRI();
        Optional<org.semanticweb.owlapi.model.IRI> owlVerIRI = owlOntology.getOntologyID().getVersionIRI();

        IRI matOntIRI;
        IRI matVerIRI;

        if (owlOntIRI.isPresent()) {
            matOntIRI = SimpleOntologyValues.matontoIRI(owlOntIRI.get());

            if (owlVerIRI.isPresent()) {
                matVerIRI = SimpleOntologyValues.matontoIRI(owlVerIRI.get());
                this.ontologyId = ontologyManager.createOntologyId(matOntIRI, matVerIRI);
            } else {
                this.ontologyId = ontologyManager.createOntologyId(matOntIRI);
            }
        } else if (resource != null) {
            this.ontologyId = ontologyManager.createOntologyId(resource);
        } else {
            this.ontologyId = ontologyManager.createOntologyId();
        }
    }

    @Override
    public OntologyId getOntologyId() {
        return ontologyId;
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        return missingImports;
    }

    @Override
    public Set<Ontology> getDirectImports() {
        return owlOntology.directImports()
                .map(SimpleOntologyValues::matontoOntology)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        return owlOntology.importsClosure()
                .map(SimpleOntologyValues::matontoOntology)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() throws MatontoOntologyException {
        if (ontoAnnotations == null) {
            getAnnotations();
        }
        return ontoAnnotations;
    }

    @Override
    public Set<Annotation> getAllAnnotations() throws MatontoOntologyException {
        if (annotations == null) {
            getAnnotations();
        }
        return annotations;
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() throws MatontoOntologyException {
        if (annotationProperties == null) {
            getAnnotationProperties();
        }
        return annotationProperties;
    }

    @Override
    public Set<OClass> getAllClasses() {
        return owlOntology.classesInSignature()
                .map(SimpleOntologyValues::matontoClass)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean containsClass(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        return owlOntology.containsClassInSignature(classIRI);
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        if (owlOntology.containsClassInSignature(classIRI)) {
            return owlOntology.objectPropertiesInSignature(Imports.INCLUDED)
                    .filter(property -> hasClassAsDomain(owlOntology.objectPropertyDomainAxioms(property), classIRI)
                                || hasNoDomain(owlOntology.objectPropertyDomainAxioms(property)))
                    .map(SimpleOntologyValues::matontoObjectProperty)
                    .collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Class not found in ontology");
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        org.semanticweb.owlapi.model.IRI classIRI = SimpleOntologyValues.owlapiIRI(iri);
        if (owlOntology.containsClassInSignature(classIRI)) {
            return owlOntology.dataPropertiesInSignature(Imports.INCLUDED)
                    .filter(property -> hasClassAsDomain(owlOntology.dataPropertyDomainAxioms(property), classIRI)
                                || hasNoDomain(owlOntology.dataPropertyDomainAxioms(property)))
                    .map(SimpleOntologyValues::matontoDataProperty)
                    .collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Class not found in ontology");
    }

    @Override
    public Set<Axiom> getAxioms() {
        return owlOntology.axioms()
                .map(SimpleOntologyValues::matontoAxiom)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        return owlOntology.datatypesInSignature()
                .map(SimpleOntologyValues::matontoDatatype)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        return owlOntology.objectPropertiesInSignature()
                .map(SimpleOntologyValues::matontoObjectProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ObjectProperty> getObjectProperty(IRI iri) {
        return getOwlObjectProperty(iri)
                .flatMap(owlObjectProperty -> Optional.of(
                        SimpleOntologyValues.matontoObjectProperty(owlObjectProperty)));
    }

    @Override
    public Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty) {
        getOwlObjectProperty(objectProperty.getIRI()).orElseThrow(() ->
                new IllegalArgumentException("Object property not found in ontology"));
        return owlOntology.objectPropertyRangeAxioms(SimpleOntologyValues.owlapiObjectProperty(objectProperty))
                .map(HasRange::getRange)
                // TODO: Return all range values, not just classes
                .filter(AsOWLClass::isOWLClass)
                .map(owlClassExpression -> SimpleOntologyValues.matontoIRI(owlClassExpression.asOWLClass().getIRI()))
                .collect(Collectors.toSet());
    }

    // TODO: Function to get the domain of a object property

    @Override
    public Set<DataProperty> getAllDataProperties() {
        return owlOntology.dataPropertiesInSignature()
                .map(SimpleOntologyValues::matontoDataProperty)
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<DataProperty> getDataProperty(IRI iri) {
        return getOwlDataProperty(iri)
                .flatMap(owlDataProperty -> Optional.of(
                        SimpleOntologyValues.matontoDataProperty(owlDataProperty)));
    }

    @Override
    public Set<Resource> getDataPropertyRange(DataProperty dataProperty) {
        getOwlDataProperty(dataProperty.getIRI()).orElseThrow(() ->
                new IllegalArgumentException("Data property not found in ontology"));
        return owlOntology.dataPropertyRangeAxioms(SimpleOntologyValues.owlapiDataProperty(dataProperty))
                .map(HasRange::getRange)
                // TODO: Return all range values, not just datatypes
                .filter(AsOWLDatatype::isOWLDatatype)
                .map(owlDataRange -> SimpleOntologyValues.matontoIRI(owlDataRange.asOWLDatatype().getIRI()))
                .collect(Collectors.toSet());
    }

    // TODO: Function to get the domain of a data property

    @Override
    public Set<Individual> getAllIndividuals() {
        return owlOntology.individualsInSignature()
                .map(SimpleOntologyValues::matontoIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return getIndividualsOfType(new SimpleClass(classIRI));
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        OWLReasonerFactory reasonerFactory = new StructuralReasonerFactory();
        OWLReasoner reasoner = reasonerFactory.createReasoner(owlOntology);
        return reasoner.getInstances(SimpleOntologyValues.owlapiClass(clazz)).entities()
                .map(SimpleOntologyValues::matontoIndividual)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<CardinalityRestriction> getCardinalityProperties(IRI classIRI) {
        CardinalityVisitor cardinalityVisitor = new CardinalityVisitor();
        OWLClass owlClass = new OWLClassImpl(org.semanticweb.owlapi.model.IRI.create(classIRI.stringValue()));
        owlOntology.subClassAxiomsForSubClass(owlClass).forEach(ax -> ax.getSuperClass().accept(cardinalityVisitor));
        owlOntology.equivalentClassesAxioms(owlClass).forEach(ax -> ax.classExpressions().forEach(classExpression ->
                classExpression.accept(cardinalityVisitor)));
        return cardinalityVisitor.getCardinalityProperties();
    }

    /**
     * Visits existential restrictions and collects the properties which are
     * restricted.
     */
    private static class CardinalityVisitor implements OWLClassExpressionVisitor {

        private final Set<CardinalityRestriction> cardinalityProperties;

        CardinalityVisitor() {
            cardinalityProperties = new HashSet<>();
        }

        Set<CardinalityRestriction> getCardinalityProperties() {
            return cardinalityProperties;
        }

        public void visit(@Nonnull OWLObjectMinCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_MIN_CARDINALITY);
        }

        public void visit(@Nonnull OWLObjectExactCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_EXACT_CARDINALITY);
        }

        public void visit(@Nonnull OWLObjectMaxCardinality ce) {
            addObjectPropertyExpression(ce, ClassExpressionType.OBJECT_MAX_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataMinCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_MIN_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataExactCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_EXACT_CARDINALITY);
        }

        public void visit(@Nonnull OWLDataMaxCardinality ce) {
            addDataPropertyExpression(ce, ClassExpressionType.DATA_MAX_CARDINALITY);
        }

        private void addObjectPropertyExpression(OWLObjectCardinalityRestriction ce,
                                                 ClassExpressionType classExpressionType) {
            add(SimpleOntologyValues.matontoObjectProperty(ce.getProperty().asOWLObjectProperty()),
                    ce.getCardinality(), classExpressionType);
        }

        private void addDataPropertyExpression(OWLDataCardinalityRestriction ce,
                                               ClassExpressionType classExpressionType) {
            add(SimpleOntologyValues.matontoDataProperty(ce.getProperty().asOWLDataProperty()),
                    ce.getCardinality(), classExpressionType);
        }

        private void add(PropertyExpression pe, int cardinality, ClassExpressionType classExpressionType) {
            cardinalityProperties.add(new SimpleCardinalityRestriction(pe, cardinality, classExpressionType));
        }
    }

    /**
     * @return the unmodifiable sesame model that represents this Ontology.
     */
    protected org.openrdf.model.Model asSesameModel() throws MatontoOntologyException {
        org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
        RDFHandler rdfHandler = new StatementCollector(sesameModel);
        RioRenderer renderer = new RioRenderer(this.owlOntology, rdfHandler, this.owlOntology.getFormat());
        renderer.render();
        return sesameModel.unmodifiable();
    }

    @Override
    public Model asModel(ModelFactory factory) throws MatontoOntologyException {
        Model matontoModel = factory.createModel();

        asSesameModel().forEach(stmt -> matontoModel.add(transformer.matontoStatement(stmt)));

        return matontoModel;
    }

    @Override
    public OutputStream asTurtle() throws MatontoOntologyException {
        return getOntologyDocument(new TurtleDocumentFormat());
    }

    @Override
    public OutputStream asRdfXml() throws MatontoOntologyException {
        return getOntologyDocument(new RDFXMLDocumentFormat());
    }

    @Override
    public OutputStream asOwlXml() throws MatontoOntologyException {
        return getOntologyDocument(new OWLXMLDocumentFormat());
    }

    @Override
    public @Nonnull OutputStream asJsonLD() throws MatontoOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        WriterConfig config = new WriterConfig();
        config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);
        try {
            Rio.write(asSesameModel(), outputStream, RDFFormat.JSONLD, config);
        } catch (RDFHandlerException e) {
            throw new MatontoOntologyException("Error while parsing Ontology.");
        }

        return outputStream;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) obj;
            OntologyId ontologyId = simpleOntology.getOntologyId();
            if (this.ontologyId.equals(ontologyId)) {
                return Models.isomorphic(this.asSesameModel(), simpleOntology.asSesameModel());
            }
        }

        return false;
    }

    @Override
    public int hashCode() {
        // TODO: This looks like an expensive operation
        return this.ontologyId.hashCode() + this.asSesameModel().hashCode();
    }

    protected OWLOntology getOwlapiOntology() {
        return this.owlOntology;
    }

    protected OWLOntologyManager getOwlapiOntologyManager() {
        return this.owlManager;
    }

    private @Nonnull OutputStream getOntologyDocument(PrefixDocumentFormatImpl prefixFormat)
            throws MatontoOntologyException {
        OutputStream os = null;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        OWLDocumentFormat format = owlManager.getOntologyFormat(owlOntology);
        if (format.isPrefixOWLDocumentFormat()) {
            prefixFormat.copyPrefixesFrom(format.asPrefixOWLDocumentFormat());
        }

        try {
            owlManager.saveOntology(owlOntology, prefixFormat, outputStream);
            os = MatOntoStringUtils.replaceLanguageTag(outputStream);
        } catch (OWLOntologyStorageException e) {
            throw new MatontoOntologyException("Unable to save to an ontology object", e);
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return MatOntoStringUtils.removeOWLGeneratorSignature(os);
    }

    private void getAnnotations() throws MatontoOntologyException {
        if (owlOntology == null) {
            throw new MatontoOntologyException("ontology is null");
        }
        ontoAnnotations = new HashSet<>();
        annotations = new HashSet<>();

        ontoAnnotations = owlOntology.annotations()
                .map(SimpleOntologyValues::matontoAnnotation)
                .collect(Collectors.toSet());
        annotations.addAll(ontoAnnotations);

        OWLOntologyWalker walker = new OWLOntologyWalker(Collections.singleton(owlOntology));
        OWLOntologyWalkerVisitor visitor = new OWLOntologyWalkerVisitor(walker) {
            @Override
            public void visit(OWLObjectSomeValuesFrom desc) {
                annotations.add(SimpleOntologyValues.matontoAnnotation(getCurrentAnnotation()));
            }
        };

        walker.walkStructure(visitor);
    }

    private void getAnnotationProperties() throws MatontoOntologyException {
        if (owlOntology == null) {
            throw new MatontoOntologyException("ontology is null");
        }
        annotationProperties = new HashSet<>();

        annotationProperties = owlOntology.annotationPropertiesInSignature()
                .map(SimpleOntologyValues::matontoAnnotationProperty)
                .collect(Collectors.toSet());
    }

    private Optional<OWLObjectProperty> getOwlObjectProperty(IRI iri) {
        return owlOntology.objectPropertiesInSignature()
                .filter(objectProperty -> objectProperty.getIRI().equals(SimpleOntologyValues.owlapiIRI(iri)))
                .findFirst();
    }

    private Optional<OWLDataProperty> getOwlDataProperty(IRI iri) {
        return owlOntology.dataPropertiesInSignature()
                .filter(dataProperty -> dataProperty.getIRI().equals(SimpleOntologyValues.owlapiIRI(iri)))
                .findFirst();
    }

    private <T extends OWLPropertyDomainAxiom<?>> boolean hasClassAsDomain(Stream<T> stream,
                                                                           org.semanticweb.owlapi.model.IRI iri) {
        return stream.map(HasDomain::getDomain)
                .filter(AsOWLClass::isOWLClass)
                .map(AsOWLClass::asOWLClass)
                .filter(owlClass -> owlClass.getIRI().equals(iri))
                .count() > 0;
    }

    private <T extends OWLPropertyDomainAxiom<?>> boolean hasNoDomain(Stream<T> stream) {
        return stream.map(HasDomain::getDomain).count() == 0;
    }
}
