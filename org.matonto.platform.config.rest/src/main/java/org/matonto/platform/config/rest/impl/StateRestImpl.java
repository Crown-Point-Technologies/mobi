package org.matonto.platform.config.rest.impl;

/*-
 * #%L
 * org.matonto.platform.config.rest
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

import static org.matonto.rest.util.RestUtils.getActiveUsername;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.platform.config.api.state.StateManager;
import org.matonto.platform.config.rest.StateRest;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.web.security.util.AuthenticationProps;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class StateRestImpl implements StateRest {
    protected StateManager stateManager;
    protected ValueFactory factory;
    protected ModelFactory modelFactory;
    protected SesameTransformer transformer;

    @Reference
    protected void setStateManager(StateManager stateManager) {
        this.stateManager = stateManager;
    }

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setModelFactory(final ModelFactory mf) {
        modelFactory = mf;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Response getStates(ContainerRequestContext context, String applicationId, List<String> subjectIds) {
        String username = getActiveUsername(context);
        Set<Resource> subjects = subjectIds.stream()
                .map(factory::createIRI)
                .collect(Collectors.toSet());
        Map<Resource, Model> results = stateManager.getStates(username, applicationId, subjects);
        JSONArray array = new JSONArray();
        results.keySet().forEach(resource -> {
            JSONObject state = new JSONObject();
            state.put("id", resource.stringValue());
            state.put("model", convertModel(results.get(resource)));
            array.add(state);
        });

        return Response.ok(array.toString()).build();
    }

    @Override
    public Response createState(ContainerRequestContext context, String applicationId, String stateJson) {
        String username = getActiveUsername(context);
        Model newState;
        try {
            newState = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(stateJson), "", RDFFormat.JSONLD));
        } catch (IOException e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
        if (newState.isEmpty()) {
            throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
        }
        Resource stateId = (applicationId == null) ? stateManager.storeState(newState, username)
                : stateManager.storeState(newState, username, applicationId);

        return Response.ok(stateId.stringValue()).build();
    }

    @Override
    public Response getState(ContainerRequestContext context, String stateId) {
        String username = getActiveUsername(context);
        Model state;
        try {
            state = stateManager.getState(factory.createIRI(stateId), username);
        } catch (MatOntoException ex) {
            if (ex.getMessage() != null && ex.getMessage().equals("State not found")) {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.NOT_FOUND);
            } else {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.FORBIDDEN);
            }
        }

        return Response.ok(convertModel(state)).build();
    }

    @Override
    public Response updateState(ContainerRequestContext context, String stateId, String newStateJson) {
        String username = getActiveUsername(context);
        Model newState;
        try {
            newState = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(newStateJson), "", RDFFormat.JSONLD));
        } catch (IOException e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
        if (newState.isEmpty()) {
            throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
        }
        try {
            stateManager.updateState(factory.createIRI(stateId), newState, username);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.FORBIDDEN);
        }
        return Response.ok().build();
    }

    @Override
    public Response deleteState(ContainerRequestContext context, String stateId) {
        String username = getActiveUsername(context);
        try {
            stateManager.deleteState(factory.createIRI(stateId), username);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.FORBIDDEN);
        }
        return Response.ok().build();
    }

    private String convertModel(Model model) {
        return modelToJsonld(transformer.sesameModel(model));
    }
}
