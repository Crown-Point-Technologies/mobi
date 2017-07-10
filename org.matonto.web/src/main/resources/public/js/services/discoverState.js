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
         * @name discoverState
         *
         * @description
         * The `discoverState` module only provides the `discoverStateService` service which 
         * contains various variables to hold the state of the discover module along with some
         * utility functions for those variables.
         */
        .module('discoverState', [])
        /**
         * @ngdoc service
         * @name discoverState.service:discoverStateService
         *
         * @description
         * `discoverStateService` is a service which contains various variables to hold the
         * state of the discover module along with some utility functions for those variables.
         */
        .service('discoverStateService', discoverStateService);
    
    function discoverStateService() {
        var self = this;
        
        /**
         * @ngdoc property
         * @name explore
         * @propertyOf discoverState.service:discoverStateService
         * @type {Object}
         *
         * @description
         * 'explore' is an object which holds properties associated with the explore tab in the
         * discover section of the application.
         */
        self.explore = {
            active: true,
            breadcrumbs: ['Classes'],
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                changed: [],
                entity: {},
                metadata: {}
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            },
            recordId: ''
        };
        
        /**
         * @ngdoc property
         * @name query
         * @propertyOf discoverState.service:discoverStateService
         * @type {Object}
         *
         * @description
         * 'query' is an object which holds properties associated with the query tab in the
         * discover section of the application.
         */
        self.query = {
            active: false
        };
        
        /**
         * @ngdoc method
         * @name resetPagedInstanceDetails
         * @methodOf discoverState.service:discoverStateService
         *
         * @description
         * Resets the explore properties to be their initial values.
         */
        self.resetPagedInstanceDetails = function() {
            self.explore.instanceDetails = {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            };
        }
        
        /**
         * @ngdoc method
         * @name cleanUpOnDatasetDelete
         * @methodOf discoverState.service:discoverStateService
         *
         * @description
         * Resets the paged details and all data associated with the provided dataset if
         * the provided datasetIRI matches the dataset that is selected. The recordId is
         * also cleared.
         *
         * @param {string} datasetIRI The IRI of the DatasetRecord which was deleted.
         */
        self.cleanUpOnDatasetDelete = function(datasetIRI) {
            if (datasetIRI === self.explore.recordId) {
                resetOnClear();
                self.explore.recordId = '';
            }
        }
        
        /**
         * @ngdoc method
         * @name cleanUpOnDatasetDelete
         * @methodOf discoverState.service:discoverStateService
         *
         * @description
         * Resets the paged details and all data associated with the provided dataset if
         * the provided datasetIRI matches the dataset that is selected. The recordId is
         * not cleared in this case.
         *
         * @param {string} datasetIRI The IRI of the DatasetRecord which was cleared.
         */
        self.cleanUpOnDatasetClear = function(datasetIRI) {
            if (datasetIRI === self.explore.recordId) {
                resetOnClear();
            }
        }
        
        /**
         * @ngdoc method
         * @name clickCrumb
         * @methodOf discoverState.service:discoverStateService
         *
         * @description
         * Removes the proper number of items from the breadcrumbs for the explore UI.
         *
         * @param {number} index The index of the breadcrumb clicked.
         */
        self.clickCrumb = function(index) {
            self.explore.breadcrumbs = _.take(self.explore.breadcrumbs, index + 1);
            self.explore.editing = false;
            self.explore.creating = false;
        }
        
        function resetOnClear() {
            self.resetPagedInstanceDetails();
            self.explore.breadcrumbs = ['Classes'];
            self.explore.classDetails = [];
            self.explore.classId = '';
            self.explore.instance = {
                changed: [],
                entity: {},
                metadata: {}
            };
        }
    }
})();