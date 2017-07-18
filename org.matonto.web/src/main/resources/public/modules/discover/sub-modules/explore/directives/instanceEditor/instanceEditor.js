/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name instanceEditor
         *
         * @description
         * The `instanceEditor` module only provides the `instanceEditor` directive which creates
         * the instance editor page.
         */
        .module('instanceEditor', [])
        /**
         * @ngdoc directive
         * @name instanceEditor.directive:instanceEditor
         * @scope
         * @restrict E
         * @requires $q
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         * @requires explore.service:exploreService
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the selected instance in an editable format.
         */
        .directive('instanceEditor', instanceEditor);
        
        instanceEditor.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService'];

        function instanceEditor($q, discoverStateService, utilService, exploreService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceEditor/instanceEditor.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.original = angular.copy(dvm.ds.explore.instance.entity);
                    dvm.isValid = true;
                    
                    dvm.save = function() {
                        var instance = dvm.ds.getInstance();
                        _.forOwn(instance, (value, key) => {
                            if (_.isArray(value) && value.length === 0) {
                                delete instance[key];
                            }
                        });
                        es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                            .then(() => es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset: dvm.ds.explore.instanceDetails.currentPage * dvm.ds.explore.instanceDetails.limit, limit: dvm.ds.explore.instanceDetails.limit}), $q.reject)
                            .then(response => {
                                dvm.ds.explore.instanceDetails.data = response.data;
                                dvm.ds.explore.instance.metadata = _.find(response.data, {instanceIRI: instance['@id']});
                                dvm.ds.explore.breadcrumbs[dvm.ds.explore.breadcrumbs.length - 1] = dvm.ds.explore.instance.metadata.title;
                                dvm.ds.explore.editing = false;
                            }, dvm.util.createErrorToast);
                    }
                    
                    dvm.cancel = function() {
                        dvm.ds.explore.instance.entity = dvm.original;
                        dvm.ds.explore.editing = false;
                    }
                }
            }
        }
})();