package com.mobi.rdf.orm.generate.gradle.plugin;

/*-
 * #%L
 * RDF ORM Gradle Plugin
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import org.gradle.api.Plugin;
import org.gradle.api.Project;

public class GradleOrmPlugin implements Plugin<Project> {

    @Override
    public void apply(Project target) {
        target.getTasks().create("generateOntologies", OrmGenerationTask.class);
    }
}