package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import org.glassfish.jersey.test.JerseyTestNg;
import org.glassfish.jersey.test.TestProperties;

import javax.ws.rs.core.Application;

public abstract class MobiRestTestNg extends JerseyTestNg.ContainerPerClassTest {
    @Override
    protected Application configure() {
        try {
            forceSet(TestProperties.CONTAINER_PORT, "0");
            return configureApp();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    protected abstract Application configureApp() throws Exception;
}
