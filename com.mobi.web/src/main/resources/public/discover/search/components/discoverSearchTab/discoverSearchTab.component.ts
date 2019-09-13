/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import './discoverSearchTab.component.scss';

const template = require('./discoverSearchTab.component.html');

/**
 * @ngdoc component
 * @name search.component:discoverSearchTab
 * @requires shared.service:discoverStateService
 *
 * @description
 * `discoverSearchTab` is a component that provides a {@link search.component:searchForm} and a
 * {@link discover.component:sparqlResultTable} to create SPARQL queries based on inputs into the `searchForm` and
 * display the results of the queries.
 */
const discoverSearchTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: discoverSearchTabComponentCtrl
};

discoverSearchTabComponentCtrl.$inject = ['discoverStateService'];

function discoverSearchTabComponentCtrl(discoverStateService) {
    var dvm = this;
    dvm.ds = discoverStateService;
}

export default discoverSearchTabComponent;