/*-
 * #%L
 * com.mobi.web
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
import './sparqlResultTable.component.scss';

const template = require('./sparqlResultTable.component.html');

/**
 * @ngdoc component
 * @name discover.component:sparqlResultTable
 *
 * @description
 * `sparqlResultTable` is a component that creates a table with a header row of binding names
 * and rows of the SPARQL query results provided in the SPARQL spec JSON format.
 *
 * @param {string[]} bindings The array of binding names for the SPARQL results
 * @param {Object[]} data The actual SPARQL query results
 * @param {Object[]} headers The headers of the SPARQL query results
 */
const sparqlResultTableComponent = {
    template,
    bindings: {
        bindings: '<',
        data: '<',
        headers: '<?'
    },
    controllerAs: 'dvm',
    controller: sparqlResultTableComponentCtrl
};

function sparqlResultTableComponentCtrl() {}

export default sparqlResultTableComponent;
