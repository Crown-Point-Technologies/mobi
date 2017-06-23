package org.matonto.explorable.dataset.rest;

/*-
 * #%L
 * org.matonto.dataset.rest
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/explorable-datasets")
@Api(value = "/explorable-datasets")
public interface ExplorableDatasetRest {
    /**
     * Retrieves all the class details associated with ontologies linked to a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array.
     *
     * @param uriInfo   The URI information of the request.
     * @param recordIRI The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} from which to retrieve the data.
     * @return A {@link Response} with a JSON array of ontology objects.
     */
    @GET
    @Path("{recordIRI}/class-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all the data associated with ontology objects, from a Dataset in the local Catalog")
    Response getClassDetails(@Context UriInfo uriInfo,
                             @PathParam("recordIRI") String recordIRI);

    /**
     * Retrieves all the instance details associated with a specific class found in the ontologies linked to a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array. Can optionally be paged if passed limit
     * and offset. Can optionally be sorted in ascending or descending order based on the instance details title.
     *
     * @param uriInfo   The URI information of the request.
     * @param recordIRI The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param classIRI  The IRI of the class type to get
     * @param offset    The offset for a page of Dataset data
     * @param limit     The number of data to return in one page
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending.
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{recordIRI}/classes/{classIRI}/instance-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves an aggregated summary of all ontology objects from a Dataset in the local Catalog")
    Response getInstanceDetails(@Context UriInfo uriInfo,
                                @PathParam("recordIRI") String recordIRI,
                                @PathParam("classIRI") String classIRI,
                                @QueryParam("offset") int offset,
                                @QueryParam("limit") int limit,
                                @DefaultValue("true") @QueryParam("ascending") boolean asc);

    /**
     * Retrieves all the property details associated with a specific class found in the ontologies linked to a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array.
     *
     * @param uriInfo   The URI information of the request.
     * @param recordIRI The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param classIRI  The IRI of the class type to get
     * @return A {@link Response} with a JSON array.
     */
    @GET
    @Path("{recordIRI}/classes/{classIRI}/property-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a list of all properties available for a class from a Dataset in the local Catalog")
    Response getClassPropertyDetails(@Context UriInfo uriInfo,
                                     @PathParam("recordIRI") String recordIRI,
                                     @PathParam("classIRI") String classIRI);

    /**
     * Retrieves an instance owned by a {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog}.
     *
     * @param uriInfo     The URI information of the request.
     * @param recordIRI   The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                    {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param instanceIRI The IRI of the instance to get
     * @return A {@link Response} with a JSON-LD serialization of the desired instance.
     */
    @GET
    @Path("{recordIRI}/instances/{instanceIRI}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves an instance of a particular class type from a Dataset in the local Catalog")
    Response getInstance(@Context UriInfo uriInfo,
                         @PathParam("recordIRI") String recordIRI,
                         @PathParam("instanceIRI") String instanceIRI);

    /**
     * Updates an instance owned by a {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} using the modifications from the provided JSON-LD.
     *
     * @param uriInfo     The URI information of the request.
     * @param recordIRI   The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                    {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param instanceIRI The IRI of the instance to get
     * @return A {@link Response} indicating whether or not the Instance was updated.
     */
    @PUT
    @Path("{recordIRI}/instances/{instanceIRI}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates an instance of a particular class type from a Dataset in the local Catalog")
    Response updateInstance(@Context UriInfo uriInfo,
                            @PathParam("recordIRI") String recordIRI,
                            @PathParam("instanceIRI") String instanceIRI,
                            String json);
}
