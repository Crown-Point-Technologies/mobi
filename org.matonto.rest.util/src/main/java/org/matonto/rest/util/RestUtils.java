package org.matonto.rest.util;

/*-
 * #%L
 * org.matonto.rest.util
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.web.security.util.AuthenticationProps;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;

import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Optional;
import javax.annotation.Nullable;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

public class RestUtils {

    /**
     * Encodes the passed string using percent encoding for use in a URL.
     *
     * @param str The string to be encoded.
     * @return The URL encoded version of the passed string.
     */
    public static String encode(String str) {
        String encoded = null;
        try {
            encoded = URLEncoder.encode(str, "UTF-8").replaceAll("%28", "(")
                    .replaceAll("%29", ")")
                    .replaceAll("\\+", "%20")
                    .replaceAll("%27", "'")
                    .replaceAll("%21", "!")
                    .replaceAll("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return encoded;
    }

    /**
     * Returns the specified RDFFormat. Currently supports Turtle, RDF/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return A RDFFormat object with the requested format.
     */
    public static RDFFormat getRDFFormat(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE;
            case "rdf/xml":
                return RDFFormat.RDFXML;
            case "jsonld":
            default:
                return RDFFormat.JSONLD;
        }
    }

    /**
     * Converts a Sesame Model into a string containing RDF in the specified RDFFormat.
     *
     * @param model A Sesame Model of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, RDFFormat format) {
        StringWriter sw = new StringWriter();
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, sw));
        Rio.write(model, rdfWriter);
        return sw.toString();
    }

    /**
     * Converts a Sesame Model into a string containing RDF in the format specified by the passed string.
     *
     * @param model A Sesame Model of RDF to convert.
     * @param format The abbreviated name of a RDFFormat.
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, String format) {
        return modelToString(model, getRDFFormat(format));
    }

    /**
     * Converts a JSON-LD string into a Sesame Model.
     *
     * @param jsonld A string of JSON-LD.
     * @return A Model containing the RDF from the JSON-LD string.
     */
    public static Model jsonldToModel(String jsonld) {
        try {
            return Rio.parse(IOUtils.toInputStream(jsonld), "", RDFFormat.JSONLD);
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Converts a Sesame Model into a JSON-LD string.
     *
     * @param model A Sesame model containing RDF.
     * @return A JSON-LD string containing the converted RDF from the Model.
     */
    public static String modelToJsonld(Model model) {
        return modelToString(model, "jsonld");
    }

    /**
     * Returns the file extension for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return The default file extension for the requested format.
     */
    public static String getRDFFormatFileExtension(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE.getDefaultFileExtension();
            case "rdf/xml":
                return RDFFormat.RDFXML.getDefaultFileExtension();
            case "owl/xml" :
                return "owx";
            case "jsonld":
            default:
                return RDFFormat.JSONLD.getDefaultFileExtension();
        }
    }

    /**
     * Returns the MIME type for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return THe default MIME type for the requested format.
     */
    public static String getRDFFormatMimeType(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE.getDefaultMIMEType();
            case "rdf/xml":
                return RDFFormat.RDFXML.getDefaultMIMEType();
            case "owl/xml" :
                return "application/owl+xml";
            case "jsonld":
            default:
                return RDFFormat.JSONLD.getDefaultMIMEType();
        }
    }

    /**
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found,
     * throws a 401 Response.
     *
     * @param context The context of a Request.
     * @param engineManager The EngineManager to use when attempting to retrieve the User.
     * @return The User who made the Request if found; throws a 401 otherwise.
     */
    public static User getActiveUser(ContainerRequestContext context, EngineManager engineManager) {
        return engineManager.retrieveUser(getActiveUsername(context)).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.UNAUTHORIZED));
    }

    /**
     * Retrieves the username associated with a Request. If the username cannot be found, throws a 401 Response.
     *
     * @param context The context of a Request.
     * @return The username of the User who made the Request if found; throws a 401 otherwise.
     */
    public static String getActiveUsername(ContainerRequestContext context) {
        Object result = context.getProperty(AuthenticationProps.USERNAME);
        if (result == null) {
            throw ErrorUtils.sendError("Missing username", Response.Status.UNAUTHORIZED);
        } else {
            return result.toString();
        }
    }

    /**
     * Tests for the existence and value of a string, assumed to be from a REST parameter.
     *
     * @param param The string parameter to check
     * @param errorMessage The error message to send if parameter is not set
     */
    public static void checkStringParam(@Nullable String param, String errorMessage) {
        if (param == null || param.isEmpty()) {
            throw ErrorUtils.sendError(errorMessage, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a single Entity object from a JSON-LD string and returns it as a JSONObject. Looks within the first
     * context object if present.
     *
     * @param json A JSON-LD string
     * @return The first object representing a single Entity present in the JSON-LD array.
     */
    public static JSONObject getObjectFromJsonld(String json) {
        JSONArray array = JSONArray.fromObject(json);
        JSONObject firstObject = Optional.ofNullable(array.optJSONObject(0)).orElse(new JSONObject());
        if (firstObject.containsKey("@graph")) {
            firstObject = Optional.ofNullable(firstObject.getJSONArray("@graph").optJSONObject(0))
                    .orElse(new JSONObject());
        }
        return firstObject;
    }
}
