package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
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

import static org.matonto.rest.util.RestUtils.getRDFFormatFileExtension;
import static org.matonto.rest.util.RestUtils.getRDFFormatMimeType;
import static org.matonto.rest.util.RestUtils.jsonldToModel;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.google.common.collect.Iterables;
import net.sf.json.JSONArray;
import net.sf.json.JSONException;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.matonto.cache.api.CacheManager;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.api.versioning.VersioningManager;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.engines.RdfEngine;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.rest.OntologyRest;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.ontology.utils.cache.OntologyCache;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.JSONQueryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.web.security.util.AuthenticationProps;
import org.openrdf.model.vocabulary.OWL;
import org.openrdf.model.vocabulary.SKOS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.cache.Cache;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    private ModelFactory modelFactory;
    private ValueFactory valueFactory;
    private OntologyManager ontologyManager;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private EngineManager engineManager;
    private SesameTransformer sesameTransformer;
    private CacheManager cacheManager;
    private VersioningManager versioningManager;

    private final Logger log = LoggerFactory.getLogger(OntologyRestImpl.class);

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    public void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    public void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    public void setCacheManager(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Reference
    public void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Override
    public Response uploadFile(ContainerRequestContext context, InputStream fileInputStream, String title,
                               String description, String keywords) {
        throwErrorIfMissingStringParam(title, "The title is missing.");
        if (fileInputStream == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }
        try {
            Ontology ontology = ontologyManager.createOntology(fileInputStream);
            return uploadOntology(context, ontology, title, description, keywords);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }
    }

    @Override
    public Response uploadOntologyJson(ContainerRequestContext context, String title, String description,
                                       String keywords, String ontologyJson) {
        throwErrorIfMissingStringParam(title, "The title is missing.");
        throwErrorIfMissingStringParam(ontologyJson, "The ontologyJson is missing.");
        try {
            Ontology ontology = ontologyManager.createOntology(ontologyJson);
            return uploadOntology(context, ontology, title, description, keywords);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                String commitIdStr, String rdfFormat) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return Response.ok(getOntologyAsRdf(ontology, rdfFormat)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr) {
        IRI recordId = valueFactory.createIRI(recordIdStr);
        try {
            if (StringUtils.isBlank(branchIdStr)) {
                ontologyManager.deleteOntology(recordId);
            } else {
                ontologyManager.deleteOntologyBranch(recordId, valueFactory.createIRI(branchIdStr));
            }
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response downloadOntologyFile(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                         String commitIdStr, String rdfFormat, String fileName) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(getOntologyAsRdf(ontology, rdfFormat));
                writer.flush();
                writer.close();
            };
            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type",
                    getRDFFormatMimeType(rdfFormat)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response saveChangesToOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                          String commitIdStr, String entityIdStr, String entityJson) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Model entityModel = getModelForEntityInOntology(ontology, entityIdStr);
            Difference diff = catalogManager.getDiff(entityModel, getModelFromJson(entityJson));
            Resource recordId = valueFactory.createIRI(recordIdStr);
            User user = getUserFromContext(context);
            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
            catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                    diff.getAdditions(), diff.getDeletions());
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getIRIsInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                      String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getAnnotationsInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                             String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addAnnotationToOntology(ContainerRequestContext context, String recordIdStr,
                                            String annotationJson) {
        verifyJsonldType(annotationJson, OWL.ANNOTATIONPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(annotationJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteAnnotationFromOntology(ContainerRequestContext context, String recordIdStr,
                                                 String annotationIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, annotationIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                         String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getClassArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addClassToOntology(ContainerRequestContext context, String recordIdStr, String classJson) {
        verifyJsonldType(classJson, OWL.CLASS.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(classJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteClassFromOntology(ContainerRequestContext context, String recordIdStr, String classIdStr,
                                            String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, classIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDatatypesInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDatatypeArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addDatatypeToOntology(ContainerRequestContext context, String recordIdStr, String datatypeJson) {
        verifyJsonldType(datatypeJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(datatypeJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDatatypeFromOntology(ContainerRequestContext context, String recordIdStr,
                                               String datatypeIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, datatypeIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getObjectPropertiesInOntology(ContainerRequestContext context, String recordIdStr,
                                                  String branchIdStr, String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addObjectPropertyToOntology(ContainerRequestContext context, String recordIdStr,
                                                String objectPropertyJson) {
        verifyJsonldType(objectPropertyJson, OWL.OBJECTPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(objectPropertyJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteObjectPropertyFromOntology(ContainerRequestContext context, String recordIdStr,
                                                     String objectPropertyIdStr, String branchIdStr,
                                                     String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, objectPropertyIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDataPropertiesInOntology(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addDataPropertyToOntology(ContainerRequestContext context, String recordIdStr,
                                              String dataPropertyJson) {
        verifyJsonldType(dataPropertyJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(dataPropertyJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDataPropertyFromOntology(ContainerRequestContext context, String recordIdStr,
                                                   String dataPropertyIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, dataPropertyIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getNamedIndividualsInOntology(ContainerRequestContext context, String recordIdStr,
                                                  String branchIdStr, String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualArray);
            return Response.ok(result).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addIndividualToOntology(ContainerRequestContext context, String recordIdStr,
                                            String individualJson) {
        verifyJsonldType(individualJson, OWL.INDIVIDUAL.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(individualJson));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteIndividualFromOntology(ContainerRequestContext context, String recordIdStr,
                                                 String individualIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, individualIdStr, recordIdStr);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getIRIsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getImportsClosure(ContainerRequestContext context, String recordIdStr, String rdfFormat,
                                      String branchIdStr, String commitIdStr) {
        try {
            Set<Ontology> importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
            JSONArray array = importedOntologies.stream()
                    .map(ontology -> getOntologyAsJsonObject(ontology, rdfFormat))
                    .collect(JSONArray::new, JSONArray::add, JSONArray::add);
            return array.size() == 0 ? Response.noContent().build() : Response.ok(array).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getAnnotationsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                       String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getAnnotationArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                   String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getClassArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDatatypesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                     String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getDatatypeArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                            String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                          String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getDataPropertyArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                            String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualArray);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyClassHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubClassesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyObjectPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                       String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubObjectPropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyDataPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                     String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubDatatypePropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyAnnotationPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                           String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubAnnotationPropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getConceptHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                        String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getConceptRelationships(ontology);
            JSONObject response = getHierarchy(results);
            return Response.ok(response).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getConceptSchemeHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getConceptSchemeRelationships(ontology);
            JSONObject response = getHierarchy(results);
            return Response.ok(response).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesWithIndividuals(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getClassesWithIndividuals(ontology);
            Map<String, Set<String>> classIndividuals = getClassIndividuals(results);
            JSONObject response = new JSONObject().element("individuals", classIndividuals);
            return Response.ok(response).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getEntityUsages(ContainerRequestContext context, String recordIdStr, String entityIRIStr,
                                    String branchIdStr, String commitIdStr, String queryType) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Resource entityIRI = valueFactory.createIRI(entityIRIStr);
            if (queryType.equals("construct")) {
                Model results = ontologyManager.constructEntityUsages(ontology, entityIRI);
                return Response.ok(modelToJsonld(sesameTransformer.sesameModel(results))).build();
            } else if (queryType.equals("select")) {
                TupleQueryResult results = ontologyManager.getEntityUsages(ontology, entityIRI);
                return Response.ok(JSONQueryResults.getResponse(results)).build();
            } else {
                throw ErrorUtils.sendError("The queryType parameter is not select or construct as expected.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getSearchResults(ContainerRequestContext context, String recordIdStr, String searchText,
                                     String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            throwErrorIfMissingStringParam(searchText, "The searchText is missing.");
            TupleQueryResult results = ontologyManager.getSearchResults(ontology, searchText);
            Map<String, Set<String>> response = new HashMap<>();
            results.forEach(queryResult -> {
                Value entity = Iterables.get(queryResult, 1).getValue();
                Value filter = Iterables.get(queryResult, 0).getValue();
                if (!(entity instanceof BNode) && !(filter instanceof BNode)) {
                    String entityString = entity.stringValue();
                    String filterString = filter.stringValue();
                    if (response.containsKey(filterString)) {
                        response.get(filterString).add(entityString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(entityString);
                        response.put(filterString, newSet);
                    }
                }
            });
            return response.size() == 0 ? Response.noContent().build() : Response.ok(JSONObject.fromObject(response))
                    .build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Uses the provided Set to construct a hierarchy of the entities provided. Each BindingSet in the Set must have the
     * parent set as the first binding and the child set as the second binding.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-child relationships for creating the
     *                         hierarchy.
     * @return a JSONObject containing the hierarchy of the entities provided.
     */
    private JSONObject getHierarchy(TupleQueryResult tupleQueryResult) {
        Map<String, Set<String>> results = new HashMap<>();
        Map<String, Set<String>> index = new HashMap<>();
        Set<String> topLevel = new HashSet<>();
        Set<String> lowerLevel = new HashSet<>();
        tupleQueryResult.forEach(queryResult -> {
            Value key = Iterables.get(queryResult, 0).getValue();
            Binding value = Iterables.get(queryResult, 1, null);
            if (!(key instanceof BNode)) {
                String keyString = key.stringValue();
                topLevel.add(keyString);
                if (value != null && !(value.getValue() instanceof BNode)) {
                    String valueString = value.getValue().stringValue();
                    lowerLevel.add(valueString);
                    if (results.containsKey(keyString)) {
                        results.get(keyString).add(valueString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(valueString);
                        results.put(keyString, newSet);
                    }
                    if (index.containsKey(valueString)) {
                        index.get(valueString).add(keyString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(keyString);
                        index.put(valueString, newSet);
                    }
                } else {
                    results.put(key.stringValue(), new HashSet<>());
                }
            }
        });
        topLevel.removeAll(lowerLevel);
        JSONArray hierarchy = new JSONArray();
        topLevel.forEach(classIRI -> {
            JSONObject item = getHierarchyItem(classIRI, results);
            hierarchy.add(item);
        });
        return new JSONObject().element("hierarchy", hierarchy).element("index", JSONObject.fromObject(index));
    }

    /**
     * Creates an item to be stored in the hierarchy.
     *
     * @param itemIRI the base item's IRI.
     * @param results the results which contains a map of parents and their associated children.
     * @return a JSONObject representing an item in the hierarchy.
     */
    private JSONObject getHierarchyItem(String itemIRI, Map<String, Set<String>> results) {
        JSONObject item = new JSONObject();
        item.put("entityIRI", itemIRI);
        if (results.containsKey(itemIRI) && results.get(itemIRI).size() > 0) {
            JSONArray subClassIRIs = new JSONArray();
            results.get(itemIRI).forEach(subClassIRI -> subClassIRIs.add(getHierarchyItem(subClassIRI, results)));
            item.put("subEntities", subClassIRIs);
        }
        return item;
    }

    /**
     * Checks to make sure that the provided String is not null or empty.
     *
     * @param param the parameter String to check
     * @return true if it is null or empty; otherwise, false
     */
    private boolean stringParamIsMissing(String param) {
        return param == null || param.length() == 0;
    }

    /**
     * Checks to make sure that the parameter is present. If it is not, it throws an error with the provided String.
     *
     * @param param        the parameter String to check
     * @param errorMessage the message String for the thrown error
     */
    private void throwErrorIfMissingStringParam(String param, String errorMessage) {
        if (stringParamIsMissing(param)) {
            throw ErrorUtils.sendError(errorMessage, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Common method to extract the User from the ContainerRequestContext.
     *
     * @param context the ContainerRequestContext from which you want to get a User.
     * @return the User associated with the ContainerRequestContext.
     */
    private User getUserFromContext(ContainerRequestContext context) {
        return engineManager.retrieveUser(RdfEngine.COMPONENT_NAME, context.getProperty(AuthenticationProps.USERNAME)
                .toString()).orElseThrow(() -> ErrorUtils.sendError("User not found", Response.Status.FORBIDDEN));
    }

    /**
     * Gets the Resource for the InProgressCommit associated with the provided User and the Record identified by the
     * provided Resource. If that User does not have an InProgressCommit, a new one will be created and that Resource
     * will be returned.
     *
     * @param user     the User with the InProgressCommit
     * @param recordId the Resource identifying the Record with the InProgressCommit
     * @return a Resource which identifies the InProgressCommit associated with the User for the Record
     */
    private Resource getInProgressCommitIRI(User user, Resource recordId) {
        Optional<InProgressCommit> optional = catalogManager.getInProgressCommit(catalogManager.getLocalCatalogIRI(),
                recordId, user);
        if (optional.isPresent()) {
            return optional.get().getResource();
        } else {
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(user);
            catalogManager.addInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommit);
            return inProgressCommit.getResource();
        }
    }

    /**
     * Optionally gets the Ontology based on the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @return an Optional containing the Ontology if it was found.
     */
    private Optional<Ontology> getOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr) {
        throwErrorIfMissingStringParam(recordIdStr, "The recordIdStr is missing.");
        Optional<Ontology> optionalOntology;
        Optional<Cache<String, Ontology>> cache = getOntologyCache();
        String key = OntologyCache.generateKey(recordIdStr, branchIdStr, commitIdStr);

        try {
            if (cache.isPresent() && cache.get().containsKey(key)) {
                log.trace("cache hit");
                optionalOntology = Optional.of(cache.get().get(key));
            } else {
                Resource recordId = valueFactory.createIRI(recordIdStr);

                if (!stringParamIsMissing(commitIdStr)) {
                    throwErrorIfMissingStringParam(branchIdStr, "The branchIdStr is missing.");
                    optionalOntology = ontologyManager.retrieveOntology(recordId, valueFactory.createIRI(branchIdStr),
                            valueFactory.createIRI(commitIdStr));
                } else if (!stringParamIsMissing(branchIdStr)) {
                    optionalOntology = ontologyManager.retrieveOntology(recordId, valueFactory.createIRI(branchIdStr));
                } else {
                    optionalOntology = ontologyManager.retrieveOntology(recordId);
                }
            }

            if (optionalOntology.isPresent()) {
                User user = getUserFromContext(context);
                Optional<InProgressCommit> optional = catalogManager.getInProgressCommit(
                        catalogManager.getLocalCatalogIRI(), valueFactory.createIRI(recordIdStr), user);

                if (optional.isPresent()) {
                    Model ontologyModel = catalogManager.applyInProgressCommit(optional.get().getResource(),
                            optionalOntology.get().asModel(modelFactory));
                    optionalOntology = Optional.of(ontologyManager.createOntology(ontologyModel));
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }

        return optionalOntology;
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in an Ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private JSONObject doWithOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                      String commitIdStr, Function<Ontology, JSONObject> iriFunction) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr);
        if (optionalOntology.isPresent()) {
            return iriFunction.apply(optionalOntology.get());
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in imported Ontologies for the Ontology identified
     * by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @return the JSON list of imported IRI lists determined by the provided Function.
     */
    private Response doWithImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                              String branchIdStr, String commitIdStr,
                                              Function<Ontology, JSONObject> iriFunction) {
        Set<Ontology> importedOntologies;
        try {
            importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
        } catch (MatontoOntologyException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        if (!importedOntologies.isEmpty()) {
            JSONArray ontoArray = new JSONArray();
            for (Ontology ontology : importedOntologies) {
                JSONObject object = iriFunction.apply(ontology);
                object.put("id", ontology.getOntologyId().getOntologyIdentifier().stringValue());
                ontoArray.add(object);
            }
            return Response.ok(ontoArray).build();
        } else {
            return Response.noContent().build();
        }
    }

    /**
     * Gets the imported Ontologies for the Ontology identified by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @return the Set of imported Ontologies.
     */
    private Set<Ontology> getImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr);
        if (optionalOntology.isPresent()) {
            Ontology baseOntology = optionalOntology.get();
            return baseOntology.getImportsClosure().stream()
                    .filter(ontology -> !ontology.getOntologyId().equals(baseOntology.getOntologyId()))
                    .collect(Collectors.toSet());
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets a JSONArray of Annotations from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of Annotations from the provided Ontology.
     */
    private JSONObject getAnnotationArray(Ontology ontology) {
        Set<IRI> iris = new HashSet<>();
        iris.addAll(ontology.getAllAnnotations()
                .stream()
                .map(Annotation::getProperty)
                .map(Entity::getIRI)
                .collect(Collectors.toSet()));
        iris.addAll(ontology.getAllAnnotationProperties()
                .stream()
                .map(AnnotationProperty::getIRI)
                .collect(Collectors.toSet()));
        return new JSONObject().element("annotationProperties", iriListToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of Classes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of Classes from the provided Ontology.
     */
    private JSONObject getClassArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllClasses()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        return new JSONObject().element("classes", iriListToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of Datatypes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of Datatypes from the provided Ontology.
     */
    private JSONObject getDatatypeArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        return new JSONObject().element("datatypes", iriListToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of ObjectProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of ObjectProperties from the provided Ontology.
     */
    private JSONObject getObjectPropertyArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllObjectProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        return new JSONObject().element("objectProperties", iriListToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of DatatypeProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of DatatypeProperties from the provided Ontology.
     */
    private JSONObject getDataPropertyArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllDataProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        return new JSONObject().element("dataProperties", iriListToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of NamedIndividuals from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of NamedIndividuals from the provided Ontology.
     */
    private JSONObject getNamedIndividualArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllIndividuals()
                .stream()
                .filter(ind -> ind instanceof NamedIndividual)
                .map(ind -> ((NamedIndividual) ind).getIRI())
                .collect(Collectors.toList());
        return new JSONObject().element("namedIndividuals", iriListToJsonArray(iris));
    }

    private JSONObject getConceptArray(Ontology ontology) {
        List<IRI> iris = ontology.getIndividualsOfType(sesameTransformer.matontoIRI(SKOS.CONCEPT))
                .stream()
                .filter(ind -> ind instanceof NamedIndividual)
                .map(ind -> ((NamedIndividual) ind).getIRI())
                .collect(Collectors.toList());
        return new JSONObject().element("concepts", iriListToJsonArray(iris));
    }

    private JSONObject getDerivedConceptTypeArray(Ontology ontology) {
        List<IRI> iris = new ArrayList<>();
        ontologyManager.getSubClassesFor(ontology, sesameTransformer.matontoIRI(SKOS.CONCEPT))
                .forEach(r -> iris.add(valueFactory.createIRI(Bindings.requiredResource(r, "s").stringValue())));
        return new JSONObject().element("derivedConcepts", iriListToJsonArray(iris));

    }

    private JSONObject getConceptSchemeArray(Ontology ontology) {
        List<IRI> iris = ontology.getIndividualsOfType(sesameTransformer.matontoIRI(SKOS.CONCEPT_SCHEME))
                .stream()
                .filter(ind -> ind instanceof NamedIndividual)
                .map(ind -> ((NamedIndividual) ind).getIRI())
                .collect(Collectors.toList());
        return new JSONObject().element("conceptSchemes", iriListToJsonArray(iris));
    }

    private JSONObject getDerivedConceptSchemeTypeArray(Ontology ontology) {
        List<IRI> iris = new ArrayList<>();
        ontologyManager.getSubClassesFor(ontology, sesameTransformer.matontoIRI(SKOS.CONCEPT_SCHEME))
                .forEach(r -> r.getBinding("s")
                        .ifPresent(b -> iris.add(valueFactory.createIRI(b.getValue().stringValue()))));
        return new JSONObject().element("derivedConceptSchemes", iriListToJsonArray(iris));

    }

    /**
     * Creates a JSONArray of items in a specific format to more easily display the results to the users.
     *
     * @param iris the Collection of IRIs to restructure into this JSONArray.
     * @return a JSONArray of the restructured items.
     */
    private JSONArray iriListToJsonArray(Collection<IRI> iris) {
        JSONArray array = new JSONArray();
        if (iris.isEmpty()) {
            return array;
        }
        for (IRI iri : iris) {
            JSONObject object = new JSONObject()
                    .element("namespace", iri.getNamespace())
                    .element("localName", iri.getLocalName());
            if (!array.contains(object)) {
                array.add(object);
            }
        }
        return array;
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @return A String containing the newly serialized Ontology.
     */
    private String getOntologyAsRdf(Ontology ontology, String rdfFormat) {
        switch (rdfFormat.toLowerCase()) {
            case "rdf/xml":
                return ontology.asRdfXml().toString();
            case "owl/xml":
                return ontology.asOwlXml().toString();
            case "turtle":
                return ontology.asTurtle().toString();
            default:
                return ontology.asJsonLD().toString();
        }
    }

    /**
     * Return a JSONObject with the requested format and the requested ontology in that format.
     *
     * @param ontology  the ontology to format and return
     * @param rdfFormat the format to serialize the ontology in
     * @return a JSONObject with the document format and the ontology in that format
     */
    private JSONObject getOntologyAsJsonObject(Ontology ontology, String rdfFormat) {
        return new JSONObject()
                .element("documentFormat", rdfFormat)
                .element("id", ontology.getOntologyId().getOntologyIdentifier().stringValue())
                .element("ontology", getOntologyAsRdf(ontology, rdfFormat));
    }

    /**
     * Return a JSONObject with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs
     * @return the JSONObject with the IRIs for all components of an ontology.
     */
    private JSONObject getAllIRIs(Ontology ontology) {
        return combineJsonObjects(getAnnotationArray(ontology), getClassArray(ontology),
                getDatatypeArray(ontology), getObjectPropertyArray(ontology), getDataPropertyArray(ontology),
                getNamedIndividualArray(ontology), getDerivedConceptTypeArray(ontology),
                getDerivedConceptSchemeTypeArray(ontology));
    }

    /**
     * Combines multiple JSONObjects into a single JSONObject.
     *
     * @param objects the JSONObjects to combine.
     * @return a JSONObject which has the combined key-value pairs from all of the provided JSONObjects.
     */
    private JSONObject combineJsonObjects(JSONObject... objects) {
        JSONObject json = new JSONObject();
        if (objects.length == 0) {
            return json;
        }
        for (JSONObject each : objects) {
            each.keySet().forEach(key -> json.put(key, each.get(key)));
        }
        return json;
    }

    /**
     * Creates a Model using the provided JSON-LD.
     *
     * @param json the JSON-LD to convert to a Model.
     * @return a Model created using the JSON-LD.
     */
    private Model getModelFromJson(String json) {
        return sesameTransformer.matontoModel(jsonldToModel(json));
    }

    /**
     * Adds the provided Model to the requester's InProgressCommit additions.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param entityModel the Model to add to the additions in the InProgressCommit.
     * @return a Response indicating the success or failure of the addition.
     */
    private Response additionsToInProgressCommit(ContainerRequestContext context, String recordIdStr,
                                                 Model entityModel) {
        User user = getUserFromContext(context);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                entityModel, null);
        return Response.status(201).build();
    }

    /**
     * Adds the Statements associated with the entity identified by the provided ID to the requester's InProgressCommit
     * deletions.
     *
     * @param context     the context of the request.
     * @param ontology    the ontology to process.
     * @param entityIdStr the ID of the entity to be deleted.
     * @param recordIdStr the ID of the record which contains the entity to be deleted.
     * @return a Response indicating the success or failure of the deletion.
     */
    private Response deletionsToInProgressCommit(ContainerRequestContext context, Ontology ontology,
                                                 String entityIdStr, String recordIdStr) {
        User user = getUserFromContext(context);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        Model ontologyModel = ontology.asModel(modelFactory);
        Resource entityId = valueFactory.createIRI(entityIdStr);
        Model model = modelFactory.createModel(ontologyModel.stream()
                .filter(statement -> statement.getSubject().equals(entityId)
                        || statement.getPredicate().equals(entityId) || statement.getObject().equals(entityId))
                .collect(Collectors.toSet()));
        if (model.size() == 0) {
            throw ErrorUtils.sendError(entityIdStr + " was not found within the ontology.",
                    Response.Status.BAD_REQUEST);
        }
        catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI, null, model);
        return Response.ok().build();
    }

    /**
     * Gets the entity from within the provided Ontology based on the provided entity ID.
     *
     * @param ontology    the Ontology to process.
     * @param entityIdStr the ID of the entity to get.
     * @return a Model representation of the entity with the provided ID.
     */
    private Model getModelForEntityInOntology(Ontology ontology, String entityIdStr) {
        Model ontologyModel = ontology.asModel(modelFactory);
        return modelFactory.createModel(ontologyModel).filter(valueFactory.createIRI(entityIdStr), null, null);
    }

    /**
     * Verifies that the provided JSON-LD contains the proper @type
     *
     * @param jsonldStr the JSON-LD of the entity being verified.
     * @param type      the @type that the entity should be.
     */
    private void verifyJsonldType(String jsonldStr, String type) {
        try {
            JSONObject json = JSONObject.fromObject(jsonldStr);
            Optional<JSONArray> optTypeArray = Optional.ofNullable(json.optJSONArray("@type"));
            if (!json.has("@id") || !optTypeArray.isPresent() || !optTypeArray.get().contains(type)) {
                throw ErrorUtils.sendError("The JSON-LD does not contain the proper type: " + type + ".",
                        Response.Status.BAD_REQUEST);
            }
        } catch (JSONException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Uploads the provided Ontology to a data store.
     *
     * @param context     the context of the request.
     * @param ontology    the Ontology to upload.
     * @param title       the title for the OntologyRecord.
     * @param description the description for the OntologyRecord.
     * @param keywords    the comma separated list of keywords associated with the OntologyRecord.
     * @return a Response indicating the success of the upload.
     */
    private Response uploadOntology(ContainerRequestContext context, Ontology ontology, String title,
                                    String description, String keywords) throws MatOntoException {
        User user = getUserFromContext(context);
        RecordConfig.Builder builder = new RecordConfig.Builder(title, Collections.singleton(user));
        if (description != null) {
            builder.description(description);
        }
        if (keywords != null) {
            builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
        }
        Resource catalogId = catalogManager.getLocalCatalogIRI();
        OntologyRecord record = catalogManager.createRecord(builder.build(), ontologyRecordFactory);
        catalogManager.addRecord(catalogId, record);
        Resource masterBranchId = record.getMasterBranch_resource().get();
        Resource commitId = versioningManager.commit(catalogId, record.getResource(), masterBranchId, user,
                "The initial commit.", ontology.asModel(modelFactory), null);

        // Cache
        getOntologyCache().ifPresent(cache -> {
            String key = OntologyCache.generateKey(record.getResource().stringValue(),
                    masterBranchId.stringValue(), commitId.stringValue());
            log.trace("caching " + key);
            cache.put(key, ontology);
        });

        JSONObject response = new JSONObject()
                .element("ontologyId", ontology.getOntologyId().getOntologyIdentifier().stringValue())
                .element("recordId", record.getResource().stringValue())
                .element("branchId", masterBranchId.stringValue())
                .element("commitId", commitId.stringValue());
        return Response.status(201).entity(response).build();
    }

    /**
     * Parse the provided Set to provide a map with all the Individuals using their parent(class) as key
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-individuals relationships for creating the
     *                         map.
     * @return a JSONObject containing the map of the individuals provided.
     */
    private Map<String, Set<String>> getClassIndividuals(TupleQueryResult tupleQueryResult) {
        Map<String, Set<String>> classIndividuals = new HashMap<>();
        tupleQueryResult.forEach(queryResult -> {
            Optional<Value> individual = queryResult.getValue("individual");
            Optional<Value> parent = queryResult.getValue("parent");
            if (individual.isPresent() && parent.isPresent()) {
                String individualValue = individual.get().stringValue();
                String keyString = parent.get().stringValue();
                if (classIndividuals.containsKey(keyString)) {
                    classIndividuals.get(keyString).add(individualValue);
                } else {
                    Set<String> individualsSet = new HashSet<>();
                    individualsSet.add(individualValue);
                    classIndividuals.put(keyString, individualsSet);
                }
            }
        });
        return classIndividuals;
    }

    private Optional<Cache<String, Ontology>> getOntologyCache() {
        Optional<Cache<String, Ontology>> cache = Optional.empty();
        if (cacheManager != null) {
            cache = cacheManager.getCache(OntologyCache.CACHE_NAME, String.class, Ontology.class);
        }
        return cache;
    }
}