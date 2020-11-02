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
import { take, includes, get, find } from 'lodash';

/**
 * @ngdoc service
 * @name shared.service:discoverStateService
 *
 * @description
 * `discoverStateService` is a service which contains various variables to hold the
 * state of the discover module along with some utility functions for those variables.
 */
function discoverStateService() {
    var self = this;

    /**
     * @ngdoc property
     * @name explore
     * @propertyOf shared.service:discoverStateService
     * @type {Object}
     *
     * @description
     * 'explore' is an object which holds properties associated with the explore tab in the
     * discover section of the application. The structure is as follows:
     * ```
     * {
     *     recordId: '', // Selected DatasetRecord ID
     *     breadcrumbs: [],
     *     editing: false,
     *     creating: false,
     *     classDetails: [], // Information about the classes with instances within the selected dataset
     *     classId: '',
     *     classDeprecated: false,
     *     instance: {
     *         entity: {},
     *         metadata: {
     *             instanceIRI: ''
     *         }
     *     },
     *     instanceDetails: {
     *         data: [],
     *         limit: 10, // The limit for the number of instances shown
     *         links: {
     *             next: '',
     *             prev: ''
     *         },
     *         total: 10,
     *         currentPage: 1
     *     },
     * }
     * ```
     */
    self.explore = {};

    /**
     * @ngdoc property
     * @name search
     * @propertyOf shared.service:discoverStateService
     * @type {Object}
     *
     * @description
     * 'search' is an object which holds properties associated with the search tab in the
     * discover section of the application.
     */
    self.search = {};

    /**
     * @ngdoc property
     * @name query
     * @propertyOf shared.service:discoverStateService
     * @type {Object}
     *
     * @description
     * 'query' is an object which holds properties associated with the query tab in the
     * discover section of the application.
     */
    self.query = {};

    setStates();

    /**
     * @ngdoc method
     * @name reset
     * @methodOf shared.service:discoverStateService
     *
     * @description
     * Resets all state variables.
     */
    self.reset = function() {
        setStates();
    }

    /**
     * @ngdoc method
     * @name resetPagedInstanceDetails
     * @methodOf shared.service:discoverStateService
     *
     * @description
     * Resets the explore properties to be their initial values.
     */
    self.resetPagedInstanceDetails = function() {
        self.explore.instanceDetails = {
            currentPage: 1,
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
     * @methodOf shared.service:discoverStateService
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
     * @methodOf shared.service:discoverStateService
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
     * @methodOf shared.service:discoverStateService
     *
     * @description
     * Removes the proper number of items from the breadcrumbs for the explore UI.
     *
     * @param {number} index The index of the breadcrumb clicked.
     */
    self.clickCrumb = function(index) {
        self.explore.breadcrumbs = take(self.explore.breadcrumbs, index + 1);
        self.explore.editing = false;
        self.explore.creating = false;
    }

    /**
     * @ngdoc method
     * @name getInstance
     * @methodOf shared.service:discoverStateService
     *
     * @description
     * Gets the instance from the entity variable which contains the instance and reified statements.
     *
     * @returns {Object} An object which contains the instance's JSON-LD.
     */
    self.getInstance = function() {
        return find(self.explore.instance.entity, obj => includes(get(obj, '@type'), self.explore.classId));
    }

    /**
     * @ngdoc method
     * @name resetSearchQueryConfig
     * @methodOf shared.service:discoverStateService
     *
     * @description
     * Resets the search query config to be the default values.
     */
    self.resetSearchQueryConfig = function() {
        var variables = angular.copy(self.search.queryConfig.variables);
        self.search.queryConfig = {
            isOrKeywords: false,
            isOrTypes: false,
            keywords: [],
            types: [],
            filters: [],
            variables
        };
    }

    function setStates() {
        self.explore = {
            active: true,
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                changed: [],
                entity: [{}],
                metadata: {},
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 1,
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
        self.search = {
            active: false,
            datasetRecordId: '',
            noDomains: undefined,
            properties: undefined,
            queryConfig: {
                isOrKeywords: false,
                isOrTypes: false,
                keywords: [],
                types: [],
                filters: [],
                variables: {}
            },
            results: undefined,
            targetedId: 'discover-search-results',
            typeObject: undefined
        };
        self.query = {
            active: false,
            queryString: '',
            response: {},
            selectedPlugin: ''
        };
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
        self.query.queryString =  '';
        self.query.response = {};
        self.query.selectedPlugin = '';
    }   
}

export default discoverStateService;