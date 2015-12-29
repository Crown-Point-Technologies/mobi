package org.matonto.web.authentication;

import org.osgi.service.http.HttpContext;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

public class StatusServlet extends HttpServlet {

    private static final long serialVersionUID = -8862681062580793856L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        final PrintWriter writer = response.getWriter();

        writer.println(HttpContext.AUTHENTICATION_TYPE + " : " + request.getAttribute(HttpContext.AUTHENTICATION_TYPE));
        writer.println("Request.getAuthType() : " + request.getAuthType());

        writer.println(HttpContext.REMOTE_USER + " : " + request.getAttribute(HttpContext.REMOTE_USER));
        writer.println("Request.getRemoteUser() : " + request.getRemoteUser());

        writer.println(HttpContext.AUTHORIZATION + " : " + request.getAttribute(HttpContext.AUTHORIZATION));
    }
}
