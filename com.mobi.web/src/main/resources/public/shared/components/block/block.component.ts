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

import './block.component.scss';

const template = require('./block.component.html');

/**
 * @ngdoc component
 * @name shared.component:block
 *
 * @description
 * `block` is a component that creates a styled container with a light box shadow. Meant to contain
 * {@link shared.component:blockContent}, {@link shared.component:blockFooter},
 * {@link shared.component:blockHeader}, and/or {@link shared.component:blockSearch} components.
 */
const blockComponent = {
    template,
    transclude: true,
    bindings: {},
    controllerAs: 'dvm',
    controller: blockComponentCtrl
};

function blockComponentCtrl() {}

export default blockComponent;
