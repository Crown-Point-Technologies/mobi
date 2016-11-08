package org.matonto.jaas.rest.impl;

/*-
 * #%L
 * org.matonto.jaas.rest
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.jaas.rest.GroupRest;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.vocabulary.DCTERMS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class GroupRestImpl implements GroupRest {
    protected EngineManager engineManager;
    protected ValueFactory factory;
    protected UserFactory userFactory;
    protected MatontoConfiguration matontoConfiguration;
    private final Logger logger = LoggerFactory.getLogger(GroupRestImpl.class);
    static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    protected void setMatOntoConfiguration(MatontoConfiguration configuration) {
        this.matontoConfiguration = configuration;
    }

    @Override
    public Response listGroups() {
        Set<String> titles = engineManager.getGroups(RDF_ENGINE).stream()
                .map(group -> group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())))
                .filter(Optional::isPresent)
                .map(title -> title.get().stringValue())
                .collect(Collectors.toSet());

        return Response.status(200).entity(titles).build();
    }

    @Override
    public Response createGroup(Group group) {
        Value title = group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST));
        if (engineManager.groupExists(title.stringValue())) {
            throw ErrorUtils.sendError("Group " + title.stringValue() + " already exists", Response.Status.BAD_REQUEST);
        }

        boolean result = engineManager.storeGroup(RDF_ENGINE, group);
        if (result) {
            logger.info("Created group " + title.stringValue());
        }
        return Response.ok(result).build();
    }

    @Override
    public Response getGroup(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));

        return Response.status(200).entity(group).build();
    }

    @Override
    public Response updateGroup(String groupName, Group newGroup) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }
        Value title = newGroup.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        if (!savedGroup.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).get().equals(title)) {
            throw ErrorUtils.sendError("Group titles must match", Response.Status.BAD_REQUEST);
        }
        if (!savedGroup.getHasGroupRole().isEmpty()) {
            newGroup.setHasGroupRole(savedGroup.getHasGroupRole());
        }
        if (!savedGroup.getMember().isEmpty()) {
            newGroup.setMember(savedGroup.getMember());
        }

        boolean result = engineManager.updateGroup(RDF_ENGINE, newGroup);
        return Response.ok(result).build();
    }

    @Override
    public Response deleteGroup(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }
        if (!engineManager.groupExists(groupName)) {
            throw ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST);
        }

        boolean result = engineManager.deleteGroup(RDF_ENGINE, groupName);
        if (result) {
            logger.info("Deleted group " + groupName);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response getGroupRoles(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        Group group = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));

        return Response.status(200).entity(new GenericEntity<Set<Role>>(group.getHasGroupRole()) {}).build();
    }

    @Override
    public Response addGroupRole(String groupName, String role) {
        if (groupName == null || role == null) {
            throw ErrorUtils.sendError("Both groupName and role must be provided", Response.Status.BAD_REQUEST);
        }
        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        Group tempGroup = engineManager.createGroup(RDF_ENGINE,
                new GroupConfig.Builder("").roles(Collections.singleton(role)).build());
        Set<Role> allRoles = savedGroup.getHasGroupRole();
        allRoles.addAll(tempGroup.getHasGroupRole());
        savedGroup.setHasGroupRole(allRoles);
        boolean result = engineManager.updateGroup(RDF_ENGINE, savedGroup);
        if (result) {
            logger.info("Added role " + role + " to group " + groupName);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response removeGroupRole(String groupName, String role) {
        if (groupName == null || role == null) {
            throw ErrorUtils.sendError("Both groupName and role must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        Group tempGroup = engineManager.createGroup(RDF_ENGINE,
                new GroupConfig.Builder("").roles(Collections.singleton(role)).build());
        Resource roleIRI = tempGroup.getHasGroupRole().stream().collect(Collectors.toList()).get(0).getResource();
        savedGroup.removeProperty(roleIRI, factory.createIRI(Group.hasGroupRole_IRI));
        boolean result = engineManager.updateGroup(RDF_ENGINE, savedGroup);
        if (result) {
            logger.info("Removed role " + role + " from group " + groupName);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response getGroupUsers(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        Set<User> members = savedGroup.getMember().stream()
                .map(agent -> userFactory.getExisting(agent.getResource(), agent.getModel()))
                .collect(Collectors.toSet());

        return Response.status(200).entity(new GenericEntity<Set<User>>(members) {}).build();
    }
}
