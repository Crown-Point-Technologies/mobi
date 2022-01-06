package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.query.api.BooleanQuery;
import com.mobi.query.exception.QueryEvaluationException;

public class SesameBooleanQuery extends SesameOperation implements BooleanQuery {

    private org.eclipse.rdf4j.query.BooleanQuery sesameBooleanQuery;

    public SesameBooleanQuery(org.eclipse.rdf4j.query.BooleanQuery sesameBooleanQuery) {
        super(sesameBooleanQuery);
        this.sesameBooleanQuery = sesameBooleanQuery;
    }

    @Override
    public boolean evaluate() throws QueryEvaluationException {
        try {
            return sesameBooleanQuery.evaluate();
        } catch (org.eclipse.rdf4j.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameBooleanQuery.toString();
    }
}
