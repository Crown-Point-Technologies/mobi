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
import './homePage.component.scss';

const template = require('./homePage.component.html');

/**
 * @ngdoc component
 * @name home.component:homePage
 *
 * @description
 * `homePage` is a component which creates the main page of the Home module. The page contains a welcome banner image
 * along with a {@link home.component:quickActionGrid grid of quick actions} and a
 * {@link home.component:activityCard list of activities} within the Mobi instance.
 */
const homePageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: homePageComponentCtrl
};

function homePageComponentCtrl() {
    var dvm = this;
}

export default homePageComponent;