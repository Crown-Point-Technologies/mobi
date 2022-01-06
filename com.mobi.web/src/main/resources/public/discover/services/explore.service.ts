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
import * as angular from 'angular';
import { get, set, has } from 'lodash';

exploreService.$inject = ['$http', '$q', 'utilService', 'REST_PREFIX'];

/**
 * @ngdoc service
 * @name discover.service:exploreService
 * @requires $http
 * @requires $q
 * @requires shared.service:utilService
 *
 * @description
 * `exploreService` is a service that provides access to the Mobi explorable-datasets REST
 * endpoints.
 */
function exploreService($http, $q, utilService, REST_PREFIX) {
    var self = this;
    var prefix = REST_PREFIX + 'explorable-datasets/';
    var util = utilService;

    /**
     * @ngdoc method
     * @name getClassDetails
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the GET /mobirest/explorable-datasets/{recordId}/class-details endpoint and returns the
     * array of class details.
     *
     * @returns {Promise} A promise that resolves to an array of the class details for the identified dataset record.
     */
    self.getClassDetails = function(recordId) {
        return $http.get(prefix + encodeURIComponent(recordId) + '/class-details')
            .then(response => response.data, util.rejectError);
    }

    /**
     * @ngdoc method
     * @name getClassInstanceDetails
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instance-details endpoint and returns the
     * array of instance details.
     *
     * @param {string} recordId The id of the Record
     * @param {string} classId The id of the Class
     * @param {Object} params The params for the REST call
     * @param {number} params.offset The offset for the query
     * @param {number} params.limit The limit for the query
     * @param {boolean} noSpinner Whether or not the spinner should be shown
     * @returns {Promise} A promise that resolves to an array of the instance details for the identified class of the
     * identified dataset record.
     */
    self.getClassInstanceDetails = function(recordId, classId, params, noSpinner = false) {
        var config: any = {params};
        if (noSpinner) {
            config.timeout = undefined;
        }
        return $http.get(prefix + encodeURIComponent(recordId) + '/classes/' + encodeURIComponent(classId) + '/instance-details', config)
            .then(response => response, util.rejectError);
    }

    /**
     * @ngdoc method
     * @name getClassPropertyDetails
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/property-details endpoint and returns the
     * array of class property details.
     *
     * @param {string} recordId The id of the Record
     * @param {string} classId The id of the Class
     * @returns {Promise} A promise that resolves to an array of the class property details for the identified class of the
     * identified dataset record.
     */
    self.getClassPropertyDetails = function(recordId, classId) {
        return $http.get(prefix + encodeURIComponent(recordId) + '/classes/' + encodeURIComponent(classId) + '/property-details')
            .then(response => response.data, util.rejectError);
    }

    /**
     * @ngdoc method
     * @name createInstance
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the POST /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances endpoint
     * and returns the instance IRI.
     *
     * @param {string} recordId The id of the Record
     * @param {Object} json The JSON-LD of the instance being created
     * @returns {Promise} A promise that resolves to the instance IRI.
     */
    self.createInstance = function(recordId, json) {
        return $http.post(prefix + encodeURIComponent(recordId) + '/instances', json)
            .then(response => response.data, util.rejectError);
    }

    /**
     * @ngdoc method
     * @name getInstance
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint
     * and returns the instance.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @returns {Promise} A promise that resolves to an instance object defined as the identified class in the
     * identified dataset record.
     */
    self.getInstance = function(recordId, instanceId) {
        return $http.get(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId))
            .then(response => response.data, util.rejectError);
    }

    /**
     * @ngdoc method
     * @name updateInstance
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the PUT /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint
     * and identifies if the instance was updated.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @param {Object} json The JSON-LD object of the new instance
     * @returns {Promise} A promise that indicates if the instance was updated successfully.
     */
    self.updateInstance = function(recordId, instanceId, json) {
        return $http.put(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId), angular.toJson(json))
            .then(response => $q.when(), util.rejectError);
    }

    /**
     * @ngdoc method
     * @name deleteInstance
     * @methodOf discover.service:exploreService
     *
     * @description
     * Calls the DELETE /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint
     * and identifies if the instance was deleted.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @returns {Promise} A promise that indicates if the instance was deleted successfully.
     */
    self.deleteInstance = function(recordId, instanceId) {
        return $http.delete(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId))
            .then(response => $q.when(), util.rejectError);
    }

    /**
     * @ngdoc method
     * @name createPagedResultsObject
     * @methodOf discover.service:exploreService
     *
     * @description
     * Creates an object which contains all of the paginated details from the provided response in the expected format.
     *
     * @param {Object} response The response of an $http call which should contain paginated details in the header.
     * @returns {Object} An object which contains all of the paginated details in the expected format.
     */
    self.createPagedResultsObject = function(response) {
        var object = {};
        set(object, 'data', response.data);
        var headers = response.headers();
        set(object, 'total', get(headers, 'x-total-count', 0));
        if (has(headers, 'link')) {
            var links = util.parseLinks(get(headers, 'link', {}));
            set(object, 'links.next', get(links, 'next', ''));
            set(object, 'links.prev', get(links, 'prev', ''));
        }
        return object;
    }
}

export default exploreService;
