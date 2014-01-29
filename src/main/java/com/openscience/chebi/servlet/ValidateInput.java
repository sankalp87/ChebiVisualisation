package com.openscience.chebi.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created with IntelliJ IDEA.
 * User: venkat
 * Date: 05/12/2012
 * Time: 10:47
 */
public class ValidateInput extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

        String chebiId = request.getParameter("chebiId");
        if (chebiId != null) {
            request.getRequestDispatcher("/pages/result.jsp").forward(request, response);
        } else {
            request.setAttribute("error", "Please enter a valid Id");
            request.getRequestDispatcher("/index.jsp").forward(request, response);
        }
    }

}
