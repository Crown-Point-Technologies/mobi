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

import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

const template = require('./classBlock.component.html');

/**
 * @ngdoc component
 * @name explore.component:classBlock
 * @requires shared.service:discoverStateService
 *
 * @description
 * `classBlock` is a component that provides a {@link explore.component:ClassBlockHeader} and a
 * {@link explore.component:classCards} to display the class details associated with a selected dataset.
 */
const classBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: classBlockComponentCtrl
};

classBlockComponentCtrl.$inject = ['discoverStateService'];

function classBlockComponentCtrl(discoverStateService: DiscoverStateService) {
    this.ds = discoverStateService;
}

export default classBlockComponent;
