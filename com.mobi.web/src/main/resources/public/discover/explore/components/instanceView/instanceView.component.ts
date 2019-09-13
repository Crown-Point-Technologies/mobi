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
import * as angular from 'angular';
import { omit } from 'lodash';

import './instanceView.component.scss';

const template = require('./instanceView.component.html');

/**
 * @ngdoc component
 * @name explore.component:instanceView
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:prefixes
 *
 * @description
 * `instanceView` is a component that displays {@link shared.component:breadCrumbs} to the class of the instance
 * being viewed. It shows the complete list of properties associated with the selected instance. If a property value
 * is reified, a toggleable dropdown display is included.
 *
 * @param {Object} entity The instance entity to view
 */
const instanceViewComponent = {
    template,
    bindings: {
        entity: '<'
    },
    controllerAs: 'dvm',
    controller: instanceViewComponentCtrl
};

instanceViewComponentCtrl.$inject = ['discoverStateService', 'utilService', 'exploreUtilsService', 'prefixes'];

function instanceViewComponentCtrl(discoverStateService, utilService, exploreUtilsService, prefixes) {
    var dvm = this;
    dvm.ds = discoverStateService;
    dvm.util = utilService;
    dvm.eu = exploreUtilsService;
    dvm.entity = {};

    dvm.$onInit = function() {
        dvm.entity = getEntity();
    }
    dvm.$onChanges = function() {
        dvm.entity = getEntity();
    }
    dvm.getLimit = function(array, limit) {
        var len = array.length;
        return len === limit ? 1 : len;
    }
    dvm.getReification = function(propIRI, valueObj) {
        var reification = dvm.eu.getReification(dvm.ds.explore.instance.entity, dvm.ds.explore.instance.metadata.instanceIRI, propIRI, valueObj);
        if (reification) {
            return omit(reification, ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object']);
        }
        return reification;
    }
    dvm.edit = function() {
        dvm.ds.explore.editing = true;
        dvm.ds.explore.instance.original = angular.copy(dvm.ds.explore.instance.entity);
    }

    function getEntity() {
        return omit(dvm.ds.getInstance(), ['@id', '@type']);
    }
}

export default instanceViewComponent;