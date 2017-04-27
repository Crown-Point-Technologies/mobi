package org.matonto.dataset.rest.impl;

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


import static org.matonto.rest.util.RestUtils.checkStringParam;
import static org.matonto.rest.util.RestUtils.getActiveUser;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams;
import org.matonto.dataset.rest.DatasetRest;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.LinksUtils;
import org.matonto.rest.util.RestUtils;
import org.matonto.rest.util.jaxb.Links;

import java.util.Arrays;
import java.util.Collections;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class DatasetRestImpl implements DatasetRest {
    private DatasetManager manager;
    private EngineManager engineManager;
    private SesameTransformer transformer;
    private ValueFactory vf;

    @Reference
    public void setManager(DatasetManager manager) {
        this.manager = manager;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Response getDatasetRecords(UriInfo uriInfo, int offset, int limit, String sort, boolean asc,
                                      String searchText) {
        try {
            LinksUtils.validateParams(limit, offset);
            DatasetPaginatedSearchParams params = new DatasetPaginatedSearchParams(vf).setOffset(offset)
                    .setAscending(asc);
            if (limit > 0) {
                params.setLimit(limit);
            }
            if (sort != null && !sort.isEmpty()) {
                params.setSortBy(vf.createIRI(sort));
            }
            if (searchText != null && !searchText.isEmpty()) {
                params.setSearchText(searchText);
            }
            PaginatedSearchResults<DatasetRecord> results = manager.getDatasetRecords(params);
            JSONArray array = JSONArray.fromObject(results.getPage().stream()
                    .map(datasetRecord -> modelToJsonld(transformer.sesameModel(datasetRecord.getModel())))
                    .map(json -> RestUtils.getTypedObjectFromJsonld(json, DatasetRecord.TYPE))
                    .collect(Collectors.toList()));

            Links links = LinksUtils.buildLinks(uriInfo, array.size(), results.getTotalSize(), limit, offset);
            Response.ResponseBuilder response = Response.ok(array).header("X-Total-Count", results.getTotalSize());
            if (links.getNext() != null) {
                response = response.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                response = response.link(links.getBase() + links.getPrev(), "prev");
            }
            return response.build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createDatasetRecord(ContainerRequestContext context, String title, String repositoryId,
                                        String datasetIRI, String description, String keywords) {
        checkStringParam(title, "Title is required");
        checkStringParam(repositoryId, "Repository id is required");
        User activeUser = getActiveUser(context, engineManager);
        DatasetRecordConfig.DatasetRecordBuilder builder = new DatasetRecordConfig.DatasetRecordBuilder(title,
                Collections.singleton(activeUser), repositoryId);
        if (datasetIRI != null && !datasetIRI.isEmpty()) {
            builder.dataset(datasetIRI);
        }
        if (description != null && !description.isEmpty()) {
            builder.description(description);
        }
        if (keywords != null && !keywords.isEmpty()) {
            builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
        }
        try {
            DatasetRecord record = manager.createDataset(builder.build());
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDatasetRecord(String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.deleteDataset(recordIRI);
            } else {
                manager.safeDeleteDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response clearDatasetRecord(String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.clearDataset(recordIRI);
            } else {
                manager.safeClearDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }
}
