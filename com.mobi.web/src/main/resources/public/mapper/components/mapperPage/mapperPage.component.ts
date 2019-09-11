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

import './mapperPage.component.scss';

const template = require('./mapperPage.component.html');

/**
 * @ngdoc component
 * @name mapper.component:mapperPage
 * @requires  shared.service:mapperStateService
 *
 * @description
 * `mapperPage` is a component which creates a {@link shared.component:tabset tabset} with different pages depending
 * on the current {@link shared.service:mapperStateService#step step} of the mapping process. The three pages are
 * {@link mapper.component:mappingSelectPage mappingSelectPage},
 * {@link mapper.component:fileUploadPage fileUploadPage}, and the
 * {@link mapper.component:editMappingPage editMappingPage}.
 */
const mapperPageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: mapperPageComponentCtrl
};

mapperPageComponentCtrl.$inject = ['mapperStateService'];

function mapperPageComponentCtrl(mapperStateService) {
    var dvm = this;
    dvm.state = mapperStateService;
}

export default mapperPageComponent;