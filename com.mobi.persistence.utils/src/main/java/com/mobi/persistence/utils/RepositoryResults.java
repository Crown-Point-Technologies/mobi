package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Statement;
import com.mobi.repository.base.RepositoryResult;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class RepositoryResults {

    /**
     * Returns the Model containing all the Statements from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing Statements for the Model
     * @param factory - The ModelFactory from which to create an empty Model
     * @return the Model containing all the Statements from a RepositoryResult.
     */
    public static Model asModel(RepositoryResult<Statement> results, ModelFactory factory) {
        Model model = factory.createModel();
        results.forEach(model::add);
        return model;
    }

    /**
     * Returns the Model containing all the Statements from a RepositoryResult with the contexts removed.
     *
     * @param results - The RepositoryResult containing Statements for the Model
     * @param factory - The ModelFactory from which to create an empty Model
     * @return the Model containing all the Statements from a RepositoryResult with the context removed.
     */
    public static Model asModelNoContext(RepositoryResult<Statement> results, ModelFactory factory) {
        Model model = factory.createModel();
        results.forEach(statement
                -> model.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return model;
    }

    /**
     * Returns the List containing all the Objects from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing the Objects for the List
     * @param <T> - The type of Objects contained in the RepositoryResult
     * @return the List containing all the Objects from a RepositoryResult.
     */
    public static <T> List<T> asList(RepositoryResult<T> results) {
        List<T> list = new ArrayList<>();
        results.forEach(list::add);
        return list;
    }

    /**
     * Returns the Set containing all the Objects from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing the Objects for the Set
     * @param <T> - The type of Objects contained in the RepositoryResult
     * @return the Set containing all the Objects from a RepositoryResult.
     */
    public static <T> Set<T> asSet(RepositoryResult<T> results) {
        Set<T> set = new HashSet<>();
        results.forEach(set::add);
        return set;
    }
}
