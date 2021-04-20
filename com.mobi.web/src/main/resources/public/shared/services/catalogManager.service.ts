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
import { identity, has, find, get, forEach, includes } from 'lodash';

catalogManagerService.$inject = ['$http', '$httpParamSerializer', 'httpService', '$q', 'prefixes', 'utilService', 'REST_PREFIX'];

/**
 * @ngdoc service
 * @name shared.service:catalogManagerService
 * @requires shared.service:httpService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 *
 * @description
 * `catalogManagerService` is a service that provides access to the Mobi catalog REST
 * endpoints and utility functions for the record, distribution, version, and branch objects
 * that are returned.
 */
function catalogManagerService($http, $httpParamSerializer, httpService, $q, prefixes, utilService, REST_PREFIX) {
    const self = this,
        util = utilService,
        prefix = REST_PREFIX + 'catalogs',
        commitsPrefix = REST_PREFIX + 'commits';

    /**
     * @ngdoc property
     * @name coreRecordTypes
     * @propertyOf shared.service:catalogManagerService
     * @type {string[]}
     *
     * @description
     * `coreRecordTypes` contains a list of IRI strings of all the core types of Records defined by Mobi.
     */
    self.coreRecordTypes = [
        prefixes.catalog + 'Record',
        prefixes.catalog + 'UnversionedRecord',
        prefixes.catalog + 'VersionedRecord',
        prefixes.catalog + 'VersionedRDFRecord'
    ];
    /**
     * @ngdoc property
     * @name sortOptions
     * @propertyOf shared.service:catalogManagerService
     * @type {Object[]}
     *
     * @description
     * `sortOptions` contains a list of objects representing all sort options for both Catalogs.
     * Each object's structure is as follows:
     * ```
     * {
     *     field: 'http://purl.org/dc/terms/title',
     *     asc: true,
     *     label: 'Title (asc)'
     * }
     * ```
     * This list is populated by the `initialize` method.
     */
    self.sortOptions = [];
    /**
     * @ngdoc property
     * @name recordTypes
     * @propertyOf shared.service:catalogManagerService
     * @type {string[]}
     *
     * @description
     * `recordTypes` contains a list of IRI strings of all types of records contained in both Catalogs.
     * This list is populated by the `initialize` method.
     */
    self.recordTypes = [];
    /**
     * @ngdoc property
     * @name localCatalog
     * @propertyOf shared.service:catalogManagerService
     * @type {Object}
     *
     * @description
     * `localCatalog` contains the JSON-LD object for the local Catalog in Mobi. It is populated by
     * the `initialize` method.
     */
    self.localCatalog = undefined;
    /**
     * @ngdoc property
     * @name distributedCatalog
     * @propertyOf shared.service:catalogManagerService
     * @type {Object}
     *
     * @description
     * `distributedCatalog` contains the JSON-LD object for the distributed Catalog in Mobi. It is
     * populated by the `initialize` method.
     */
    self.distributedCatalog = undefined;

    /**
     * @ngdoc property
     * @name differencePageSize
     * @propertyOf shared.service:catalogManagerService
     * @type {int}
     *
     * @description
     * `differencePageSize` tracks the number of differences to show per page
     */
    self.differencePageSize = 100;

    /**
     * @ngdoc method
     * @name initialize
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Initializes the `sortOptions`, `recordTypes`, `localCatalog`, and `distributedCatalog` of the
     * catalogManagerService using the `getSortOptions` and `getRecordTypes` methods along with the
     * GET /mobirest/catalogs endpoint. If the local or distributed Catalog cannot be found, rejects
     * with an error message.
     *
     * @returns {Promise} A promise that resolves if initialization was successful or is rejected
     * with an error message
     */
    self.initialize = function() {
        return $q.all([self.getRecordTypes(), self.getSortOptions(), $http.get(prefix)])
            .then(responses => {
                self.localCatalog = find(responses[2].data, {[prefixes.dcterms + 'title']: [{'@value': 'Mobi Catalog (Local)'}]});
                self.distributedCatalog = find(responses[2].data, {[prefixes.dcterms + 'title']: [{'@value': 'Mobi Catalog (Distributed)'}]});
                if (!self.localCatalog) {
                    return $q.reject('Could not find local catalog');
                }
                if (!self.distributedCatalog) {
                    return $q.reject('Could not find distributed catalog');
                }
                self.recordTypes = responses[0];
                forEach(responses[1], option => {
                    const label = util.getBeautifulIRI(option);
                    if (!find(self.sortOptions, {field: option})) {
                        self.sortOptions.push({
                            field: option,
                            asc: true,
                            label: label + ' (asc)'
                        }, {
                            field: option,
                            asc: false,
                            label: label + ' (desc)'
                        });
                    }
                });
            }, () => $q.reject('Error in catalogManager initialization'));
    };

    /**
     * @ngdoc method
     * @name getRecordTypes
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/record-types endpoint and returns the
     * array of record type IRIs.
     *
     * @returns {Promise} A promise that resolves to an array of the IRIs for all
     * record types in the catalog
     */
    self.getRecordTypes = function() {
        return $http.get(prefix + '/record-types').then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getSortOptions
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/sort-options endpoint and returns the
     * array of record property IRIs.
     *
     * @return {Promise} A promise that resolves to an array of the IRIs for all
     * supported record properties to sort by
     */
    self.getSortOptions = function() {
        return $http.get(prefix + '/sort-options').then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getResultsPage
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls whichever endpoint is in the passed URL and returns the paginated response for that
     * endpoint.
     *
     * @param  {string} url A URL for a paginated call. Typically, this URL will be one of the URLs
     * in the "link" header of a paginated response.
     *
     * @returns {Promise} A promise that either resolves with a paginated response or is rejected
     * with a error message
     */
    self.getResultsPage = function(url) {
        return $http.get(url).then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getKeywords
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/keywords endpoint and returns the paginated
     * response for the query using the passed page index and limit. The data of the response will
     * be the array of Keywords with counts, the "x-total-count" headers will contain the total number of Records
     * matching the query, and the "link" header will contain the URLs for the next and previous page
     * if present.
     *
     * @param {string} catalogId The id of the Catalog to retrieve Records from
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {string} [id=''] The identifier for this request
     * @returns {Promise} A promise that either resolves with the paginated response or is rejected
     * with a error message
     */
    self.getKeywords = function(catalogId, paginatedConfig, id = '') {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        const url = prefix + '/' + encodeURIComponent(catalogId) + '/keywords';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecords
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records endpoint and returns the paginated
     * response for the query using the passed page index, limit, sort option from the `sortOptions`
     * array, and Record type filter IRI from the `recordTypes` array. The data of the response will
     * be the array of Records, the "x-total-count" headers will contain the total number of Records
     * matching the query, and the "link" header will contain the URLs for the next and previous page
     * if present.
     *
     * @param {string} catalogId The id of the Catalog to retrieve Records from
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {Object} paginatedConfig.sortOption A sort option object from the `sortOptions` array
     * @param {string} paginatedConfig.recordType A record type IRI string from the `recordTypes` array
     * @param {string} paginatedConfig.searchText The text to search for within the list of Records
     * @param {string} paginatedConfig.keywords The keywords for within the list of Records
     * @param {string} [id=''] The identifier for this request
     * @returns {Promise} A promise that either resolves with the paginated response or is rejected
     * with a error message
     */
    self.getRecords = function(catalogId, paginatedConfig, id = '') {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        setDefaultSort(config.params);
        if (get(paginatedConfig, 'searchText')) {
            config.params.searchText = paginatedConfig.searchText;
        }
        if (get(paginatedConfig, 'recordType')) {
            config.params.type = paginatedConfig.recordType;
        }
        if (get(paginatedConfig, 'keywords')) {
           config.params.keywords = encodeURIComponent(paginatedConfig.keywords.join(','));
        }
        const url = prefix + '/' + encodeURIComponent(catalogId) + '/records';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed
     * Catalog and Record ids and returns the matching Record object if it exists.
     *
     * @param {string} recordId The id of the Record to retrieve
     * @param {string} catalogId The id of the Catalog with the specified Record
     * @return {Promise} A promise that resolves to the Record if it exists or is rejected with
     * an error message
     */
    self.getRecord = function(recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId))
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records endpoint with the passed Catalog id and
     * metadata and creates a new Record for the identified Catalog. Returns a Promise with the IRI of the
     * new Record if successful or rejects with an error message.
     *
     * @param {string} catalogId The id of the Catalog to create the Record in
     * @param {Object} recordConfig A configuration object containing metadata for the new Record
     * @param {string} recordConfig.type A record type IRI string from the `recordTypes` array
     * @param {string} recordConfig.title The required title of the new Record
     * @param {string} recordConfig.identifier The optional identifier string for the new Record
     * @param {string} recordConfig.description The optional description of the new Record
     * @param {string[]} recordConfig.keywords The optional keywords to associate with the new Record.
     * @return {Promise} A promise that resolves to the IRI of the new Record or is rejected with an error
     * message
     */
    self.createRecord = function(catalogId, recordConfig) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('type', recordConfig.recordType);
        fd.append('title', recordConfig.title);
        if (has(recordConfig, 'description')) {
            fd.append('description', recordConfig.description);
        }
        forEach(get(recordConfig, 'keywords', []), word => fd.append('keywords', word));
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records', fd, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name updateRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed Catalog and
     * Record ids and updates the identified Record with the passed Record JSON-LD object.
     *
     * @param {string} recordId The id of the Record to update
     * @param {string} catalogId The id of the Catalog with the specified Record
     * @param {Object} newRecord The JSON-LD object of the new Record
     * @return {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateRecord = function(recordId, catalogId, newRecord) {
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId), angular.toJson(newRecord))
            .then(response => recordId, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed Catalog
     * and Record ids and removes the identified Record and all associated entities from Mobi.
     *
     * @param {string} recordId The id of the Record to delete
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteRecord = function(recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId))
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordDistributions
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/distributions endpoint and
     * returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Distributions, the
     * "x-total-count" headers will contain the total number of Distributions matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} recordId The id of the Record to retrieve the Distributions of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {Object} paginatedConfig.sortOption A sort option object from the `sortOptions` array
     * @return {Promise} A promise that resolves to the paginated response or is rejected
     * with a error message
     */
    self.getRecordDistributions = function(recordId, catalogId, paginatedConfig) {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        setDefaultSort(config.params);
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions', config)
            .then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}
     * endpoint and returns the matching Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to retrieve
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Distribution if it is found or is rejected
     * with an error message
     */
    self.getRecordDistribution = function(distributionId, recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId))
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createRecordDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/distributions endpoint with the passed
     * Catalog and Record id and metadata and creates a new Distribution for the identified Record. Returns a
     * Promise with the IRI of the new Distribution if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Distribution for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} distributionConfig A configuration object containing metadata for the new Distribution
     * @param {string} distributionConfig.title The required title of the new Distribution
     * @param {string} distributionConfig.description The optional description of the new Distribution
     * @param {string} distributionConfig.format The optional format of the new Distribution (should be a MIME type)
     * @param {string} distributionConfig.accessURL The optional access URL of the new Distribution
     * @param {string} distributionConfig.downloadURL The optional download URL of the new Distribution
     * @return {Promise} A promise the resolves to the IRI of the new Distribution or is rejected with an error
     * message
     */
    self.createRecordDistribution = function(recordId, catalogId, distributionConfig) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('title', distributionConfig.title);
        if (has(distributionConfig, 'description')) {
            fd.append('description', distributionConfig.description);
        }
        if (has(distributionConfig, 'format')) {
            fd.append('format', distributionConfig.format);
        }
        if (has(distributionConfig, 'accessURL')) {
            fd.append('accessURL', distributionConfig.accessURL);
        }
        if (has(distributionConfig, 'downloadURL')) {
            fd.append('downloadURL', distributionConfig.downloadURL);
        }
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions', fd, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name updateRecordDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId} endpoint with
     * the passed Catalog, Record, and Distribution ids and updates the identified Distribution with the passed
     * Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to update
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} newDistribution The JSON-LD object of the new Distribution
     * @return {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateRecordDistribution = function(distributionId, recordId, catalogId, newDistribution) {
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId), angular.toJson(newDistribution))
            .then(response => distributionId, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteRecordDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId} endpoint
     * with the passed Catalog, Record, and Distribution ids and removes the identified Distribution and all associated
     * entities from Mobi.
     *
     * @param {string} distributionId The id of the Distribution to delete
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteRecordDistribution = function(distributionId, recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId))
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordVersions
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint and
     * returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Versions, the
     * "x-total-count" headers will contain the total number of Versions matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} recordId The id of the Record to retrieve the Versions of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {Object} paginatedConfig.sortOption A sort option object from the `sortOptions` array
     * @return {Promise} A promise that resolves to the paginated response or is rejected
     * with a error message
     */
    self.getRecordVersions = function(recordId, catalogId, paginatedConfig) {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        setDefaultSort(config.params);
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions', config)
            .then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordLatestVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/latest
     * endpoint and returns the matching Version JSON-LD object for the Record's latest Version.
     *
     * @param {string} recordId The id of the Record to retrieve the latest Version of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Version if it is found or is rejected
     * with an error message
     */
    self.getRecordLatestVersion = function(recordId, catalogId) {
        return getRecordVersion('latest', recordId, catalogId);
    };

    /**
     * @ngdoc method
     * @name getRecordVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}
     * endpoint and returns the matching Version JSON-LD object.
     *
     * @param {string} versionId The id of the Version to retrieve
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Version if it is found or is rejected
     * with an error message
     */
    self.getRecordVersion = function(versionId, recordId, catalogId) {
        return getRecordVersion(encodeURIComponent(versionId), recordId, catalogId);
    };

    /**
     * @ngdoc method
     * @name createRecordVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint with the passed
     * Catalog and Record ids and metadata and creates a new Version for the identified Record. Returns a
     * Promise with the IRI of the new Version if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Version for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} versionConfig A configuration object containing metadata for the new Version
     * @param {string} versionConfig.title The required title of the new Version
     * @param {string} versionConfig.description The optional description of the new Version
     * @return {Promise} A promise the resolves to the IRI of the new Version or is rejected with an error
     * message
     */
    self.createRecordVersion = function(recordId, catalogId, versionConfig) {
        versionConfig.type = prefixes.catalog + 'Version';
        return createVersion(recordId, catalogId, versionConfig);
    };

    /**
     * @ngdoc method
     * @name createRecordTag
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint with the passed
     * Catalog and Record ids, and metadata and creates a new Tag for the identified Record. Returns a Promise
     * with the IRI of the new Tag if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Tag for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} tagConfig A configuration object containing metadata for the new Tag
     * @param {string} tagConfig.title The required title of the new Tag
     * @param {string} tagConfig.description The optional description of the new Tag
     * @param {string} tagConfig.iri The IRI for the new Tag
     * @param {string} tagConfig.commit The IRI of the Commit for the new Tag
     * @param {string} commitId The id of the Commit to associate with the new Tag
     * @return {Promise} A promise the resolves to the IRI of the new Tag or is rejected with an error
     * message
     */
    self.createRecordTag = function(recordId, catalogId, tagConfig) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('iri', tagConfig.iri);
        fd.append('title', tagConfig.title);
        fd.append('commit', tagConfig.commitId);
        if (has(tagConfig, 'description')) {
            fd.append('description', tagConfig.description);
        }
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/tags', fd, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name updateRecordVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId} endpoint with
     * the passed Catalog, Record, and Version ids and updates the identified Version with the passed
     * Version JSON-LD object.
     *
     * @param {string} versionId The id of the Version to update
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} newVersion The JSON-LD object of the new Version
     * @return {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateRecordVersion = function(versionId, recordId, catalogId, newVersion) {
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId), angular.toJson(newVersion))
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteRecordVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId} endpoint
     * with the passed Catalog, Record, and Version ids and removes the identified Version and all associated
     * entities from Mobi.
     *
     * @param {string} versionId The id of the Version to delete
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteRecordVersion = function(versionId, recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId))
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getVersionCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/commit endpoint
     * with the passed Catalog, Record, and Version ids and retrieves the associated Commit for the identified
     * Version in the passed RDF format.
     *
     * @param {string} versionId The id of the Version to retrieve the Commit of
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string='jsonld'} format The RDF format to return the Commit additions and deletions in
     * @return {Promise} A promise that resolves to the Version's Commit if found or rejects with an error message
     */
    self.getVersionCommit = function(versionId, recordId, catalogId, format = 'jsonld') {
        const config = { params: {format} };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getVersionDistributions
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions
     * endpoint and returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Distributions, the
     * "x-total-count" headers will contain the total number of Distributions matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} versionId The id of the Version to retrieve the Distributions of
     * @param {string} recordId The id of the Record to the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {Object} paginatedConfig.sortOption A sort option object from the `sortOptions` array
     * @return {Promise} A promise that resolves to the paginated response or is rejected
     * with a error message
     */
    self.getVersionDistributions = function(versionId, recordId, catalogId, paginatedConfig) {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        setDefaultSort(config.params);
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions', config)
            .then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint and returns the matching Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to retrieve
     * @param {string} recordId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Distribution if it is found or is rejected
     * with an error message
     */
    self.getVersionDistribution = function(distributionId, versionId, recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId))
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createVersionDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions
     * endpoint with the passed Catalog, Record, and Version ids and metadata and creates a new Distribution
     * for the identified Version. Returns a Promise with the IRI of the new Distribution if successful or
     * rejects with an error message.
     *
     * @param {string} version The id of the Version to create the Distribution for
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} distributionConfig A configuration object containing metadata for the new Distribution
     * @param {string} distributionConfig.title The required title of the new Distribution
     * @param {string} distributionConfig.description The optional description of the new Distribution
     * @param {string} distributionConfig.format The optional format of the new Distribution (should be a MIME type)
     * @param {string} distributionConfig.accessURL The optional access URL of the new Distribution
     * @param {string} distributionConfig.downloadURL The optional download URL of the new Distribution
     * @return {Promise} A promise the resolves to the IRI of the new Distribution or is rejected with an error
     * message
     */
    self.createVersionDistribution = function(versionId, recordId, catalogId, distributionConfig) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('title', distributionConfig.title);
        if (has(distributionConfig, 'description')) {
            fd.append('description', distributionConfig.description);
        }
        if (has(distributionConfig, 'format')) {
            fd.append('format', distributionConfig.format);
        }
        if (has(distributionConfig, 'accessURL')) {
            fd.append('accessURL', distributionConfig.accessURL);
        }
        if (has(distributionConfig, 'downloadURL')) {
            fd.append('format', distributionConfig.downloadURL);
        }
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions', fd, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name updateVersionDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint with the passed Catalog, Record, Version, and Distribution ids and updates the identified Distribution with
     * the passed Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to update
     * @param {string} versionId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} newDistribution The JSON-LD object of the new Distribution
     * @return {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateVersionDistribution = function(distributionId, versionId, recordId, catalogId, newDistribution) {
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId), angular.toJson(newDistribution))
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteVersionDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint with the passed Catalog, Record, Version, and Distribution ids and removes the identified Distribution and all
     * associated entities from Mobi.
     *
     * @param {string} distributionId The id of the Distribution to delete
     * @param {string} versionId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteVersionDistribution = function(distributionId, versionId, recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId))
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordBranches
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint and
     * returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Branches, the
     * "x-total-count" headers will contain the total number of Branches matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} recordId The id of the Record to retrieve the Branches of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} paginatedConfig A configuration object for paginated requests
     * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
     * @param {number} paginatedConfig.limit The number of results per page
     * @param {Object} paginatedConfig.sortOption A sort option object from the `sortOptions` array
     * @param {Object} paginatedConfig.applyUserFilter Whether or not the list should be filtered based
     * on the currently logged in User
     * @return {Promise} A promise that resolves to the paginated response or is rejected
     * with a error message
     */
    self.getRecordBranches = function(recordId, catalogId, paginatedConfig, applyUserFilter = false) {
        const config = {
            params: util.paginatedConfigToParams(paginatedConfig)
        };
        setDefaultSort(config.params);
        config.params.applyUserFilter = applyUserFilter;
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches', config)
            .then($q.resolve, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getRecordMasterBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/master endpoint and
     * returns the matching Branch JSON-LD object for the Record's master Branch.
     *
     * @param {string} recordId The id of the Record to retrieve the master Branch of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Branch if it is found or is rejected
     * with an error message
     */
    self.getRecordMasterBranch = function(recordId, catalogId) {
        return getRecordBranch('master', recordId, catalogId);
    };

    /**
     * @ngdoc method
     * @name getRecordBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}
     * endpoint and returns the matching Branch JSON-LD object.
     *
     * @param {string} branchId The id of the Branch to retrieve
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves to the Branch if it is found or is rejected
     * with an error message
     */
    self.getRecordBranch = function(branchId, recordId, catalogId) {
        return getRecordBranch(encodeURIComponent(branchId), recordId, catalogId);
    };

    /**
     * @ngdoc method
     * @name createRecordBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint with the passed
     * Catalog and Record ids, metadata, and associated Commit id and creates a new Branch for the identified
     * Record. Returns a Promise with the IRI of the new Branch if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Branch for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} branchConfig A configuration object containing metadata for the new Branch
     * @param {string} branchConfig.title The required title of the new Branch
     * @param {string} branchConfig.description The optional description of the new Branch
     * @param {string} commitId The id of the Commit to associate with the new Branch
     * @return {Promise} A promise the resolves to the IRI of the new Branch or is rejected with an error
     * message
     */
    self.createRecordBranch = function(recordId, catalogId, branchConfig, commitId) {
        branchConfig.type = prefixes.catalog + 'Branch';
        return createBranch(recordId, catalogId, branchConfig, commitId);
    };

    /**
     * @ngdoc method
     * @name createRecordBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint with the passed
     * Catalog and Record ids, metadata, and associated Commit id and creates a new UserBranch for the identified
     * Record. Returns a Promise with the IRI of the new UserBranch if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the UserBranch for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {Object} branchConfig A configuration object containing metadata for the new Branch
     * @param {string} branchConfig.title The required title of the new Branch
     * @param {string} branchConfig.description The optional description of the new Branch
     * @param {string} commitId The id of the Commit to associate with the new Branch
     * @param {string} parentBranchId The id of the parent Branch the UserBranch was created from
     * @return {Promise} A promise the resolves to the IRI of the new UserBranch or is rejected with an error
     * message
     */
    self.createRecordUserBranch = function(recordId, catalogId, branchConfig, commitId, parentBranchId) {
        branchConfig.type = prefixes.catalog + 'UserBranch';
        return createBranch(recordId, catalogId, branchConfig, commitId)
            .then(iri => self.getRecordBranch(iri, recordId, catalogId), $q.reject)
            .then(branch => {
                branch[prefixes.catalog + 'head'] = [{'@id': commitId}];
                branch[prefixes.catalog + 'createdFrom'] = [{'@id': parentBranchId}];
                return self.updateRecordBranch(branch['@id'], recordId, catalogId, branch);
            }, $q.reject);
    };

    /**
     * @ngdoc method
     * @name updateRecordBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId} endpoint with
     * the passed Catalog, Record, and Branch ids and updates the identified Branch with the passed
     * Branch JSON-LD object.
     *
     * @param {string} branchId The id of the Branch to update
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} newBranch The JSON-LD object of the new Branch
     * @return {Promise} A promise that resolves with the IRI of the Branch if the update was successful or
     * rejects with an error message
     */
    self.updateRecordBranch = function(branchId, recordId, catalogId, newBranch) {
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId), angular.toJson(newBranch))
            .then(response => branchId, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteRecordBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId} endpoint
     * with the passed Catalog, Record, and Branch ids and removes the identified Branch and all associated
     * entities from Mobi.
     *
     * @param {string} branchId The id of the Branch to delete
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteRecordBranch = function(branchId, recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId))
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/commits/{commitId} endpoint with the passed Commit id.
     *
     * @param {string} commitId The id of the Commit to retrieve
     * @param {string} [format='jsonld'] format The RDF format to return the Commit additions and deletions in
     * @return {Promise} A promise that resolves with the Commit or rejects with an error message
     */
    self.getCommit = function(commitId, format = 'jsonld') {
        const config = {
            params: { format }
        };

        return $http.get(commitsPrefix + '/' + encodeURIComponent(commitId), config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getCommitHistory
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/commits/{commitId}/history endpoint with the passed Commit id.
     * 
     * @param {string} commitId - The commit id of the commit which should be the most recent commit in the 
     *      history.
     * @param {string} targetId - The commit id of the commit which should be the oldest commit in 
     *      the history.
     * @param {string} entityId - The commit id of the commit which should be contained in the history's
     *      commit list.
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that resolves with the list of Commits or rejects with an error message
     */
    self.getCommitHistory = function(commitId, targetId, entityId, id = '') {
        const config = {
            params: { targetId, entityId }
        };

        const url = commitsPrefix + '/' + encodeURIComponent(commitId) + '/history';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);

        return promise.then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getCompiledResource
     * @methodOf catalogManager.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/commits/{commitId}/resource endpoint with the passed Commit id.
     *
     * @param {string} commitId - The commit id of the commit which should be the most recent commit in
     *      the history.
     * @param {string} entityId - The id of the entity which is used to filter the resource list.
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that resolves with the Compiled Resource of a commit or rejects with an error
     *      message.
     */
    self.getCompiledResource = function(commitId, entityId, id = '') {
        const config = {
            params: { entityId }
        };

        const url = commitsPrefix + '/' + encodeURIComponent(commitId) + '/resource';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);

        return promise.then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getDifference
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/commits/{commitId}/difference endpoint with the passed Commit id and Optional Target id
     * and returns the Difference between the source and target Commit chains.
     * 
     * @param {string} commitId The commit id of the commit whose chain will be merged in to the target.
     * @param {string} [targetId=''] Optional commit id of the commit to receive the source commits.
     * @param {string} [format='jsonld'] format The RDF format to return the Difference in
     * @return {Promise} A promise that resolves with the Difference of the two resulting Commit chains or 
     *      rejects with an error message
     */
    self.getDifference = function(commitId, targetId, limit, offset, format='jsonld') {
        const config = {
            params: { targetId, limit, offset, format }
        };
        return limit ? $http.get(commitsPrefix + '/' + encodeURIComponent(commitId) + '/difference', config)
        .then(response => response, util.rejectError) : 
        $http.get(commitsPrefix + '/' + encodeURIComponent(commitId) + '/difference', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getDifferenceForSubject
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/commits/{commitId}/difference/{subjectId} endpoint with the passed Commit id and Subject Id
     * and returns the Difference between the source and target Commit chains for the specified entity.
     * 
     * @param {string} subjectId Id of the entity to receive the source commits.
     * @param {string} commitId The commit id of the commit whose chain will be merged in to the target.
     * @param {string} [format='jsonld'] format The RDF format to return the Difference in
     * @return {Promise} A promise that resolves with the Difference of the two resulting Commit chains or 
     *      rejects with an error message
     */
    self.getDifferenceForSubject = function(subjectId, commitId, format='jsonld') {
        const config = { params: { format } };
        return $http.get(commitsPrefix + '/' + encodeURIComponent(commitId) + '/difference' + '/' + encodeURIComponent(subjectId), config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getBranchCommits
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits endpoint
     * with the passed Catalog, Record, and Branch ids and retrieves the list of Commits in that Branch.
     *
     * @param {string} branchId The id of the Branch to retrieve the Commits of
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} targetId The id of the target Branch to retrieve commits that are between that and the
     *      branchId
     * @return {Promise} A promise that resolves with the list of Branch Commits or rejects with an error message
     */
    self.getBranchCommits = function(branchId, recordId, catalogId, targetId) {
        const config = {
            params: { targetId }
        };

        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createBranchCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits endpoint
     * with the passed Catalog, Record, and Branch ids and string message and creates a Commit on the identified
     * Branch using the logged in User's InProgressCommit with the passed message.
     *
     * @param {string} branchId The id of the Branch to create the Commit for
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} message The message for the new Commit
     * @return {Promise} A promise that resolves to the if of the new Commit or rejects with an error message
     */
    self.createBranchCommit = function(branchId, recordId, catalogId, message) {
        const config = { params: {message} };
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits', null, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getBranchHeadCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/head endpoint
     * and returns the matching Commit JSON object of the Branch's head Commit in the passed RDF format.
     *
     * @param {string} branchId The id of the Branch to retrieve the head Commit of
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string='jsonld'} format The RDF format to return the Commit additions and deletions in
     * @return {Promise} A promise that resolves to the Commit if found or rejects with an error message
     */
    self.getBranchHeadCommit = function(branchId, recordId, catalogId, format = 'jsonld') {
        const config = { params: {format} };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getBranchCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId} endpoint
     * and returns the matching Commit JSON object in the passed RDF format.
     *
     * @param {string} commitId The id of the Commit to retrieve
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string='jsonld'} format The RDF format to return the Commit additions and deletions in
     * @return {Promise} A promise that resolves to the Commit if found or rejects with an error message
     */
    self.getBranchCommit = function(commitId, branchId, recordId, catalogId, format = 'jsonld') {
        const config = { params: {format} };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId), config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getBranchDifference
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/difference endpoint
     * and returns an object with the culmination of additions and deletions between the identified source
     * Branch and the target Branch identified by the passed id.
     *
     * @param {string} sourceId The id of the source Branch to retrieve differences from
     * @param {string} targetId The id of the target Branch to compare against the source Branch
     * @param {string} recordId The id of the Record with both specified Branches
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {string} [format='jsonld'] The RDF format to return the difference additions and deletions in
     * @return {Promise} A Promise the resolves to the object with key `additions` and key `deletions` or rejects
     * with an error message.
     */
    self.getBranchDifference = function(sourceId, targetId, recordId, catalogId, format = 'jsonld') {
        const config = { params: { format, targetId } };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(sourceId) + '/difference', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getBranchConflicts
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts endpoint
     * and returns an array of conflicts between the identified source Branch and the target Branch identified by
     * the passed id.
     *
     * @param {string} sourceId The id of the source Branch to retrieve conflicts for
     * @param {string} targetId The id of the target Branch to retrieve conflicts for
     * @param {string} recordId The id of the Record with both specified Branches
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} [format='jsonld'] The RDF format to return the Conflict additions and deletions in
     * @return {Promise} A promise that resolves to the array of Conflict objects or rejects with an error message
     */
    self.getBranchConflicts = function(sourceId, targetId, recordId, catalogId, format = 'jsonld') {
        const config = {
            params: {
                format,
                targetId
            }
        };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(sourceId) + '/conflicts', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name mergeBranches
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts/resolution endpoint
     * and performs a merge between the two identified Branches, creating a Commit using the additions and deletions JSON-LD
     * provided in the passed difference object.
     *
     * @param {string} sourceId The id of the source Branch to merge
     * @param {string} targetId The id of the target Branch to merge
     * @param {string} recordId The id of the Record with both specified Records
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} differenceObj An object representing a collection of added and deleted statements
     * @param {Object[]} differenceObj.additions The JSON-LD array of added statements
     * @param {Object[]} differenceObj.deletions The JSON-LD array of deleted statements
     * @return {Promise} A promise that resolves with the id of the Commit resulting from the merge or rejects with an error
     * message
     */
    self.mergeBranches = function(sourceId, targetId, recordId, catalogId, differenceObj) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                },
                params: {targetId}
            };
        fd.append('additions', has(differenceObj, 'additions') ? JSON.stringify(differenceObj.additions) : '[]');
        fd.append('deletions', has(differenceObj, 'deletions') ? JSON.stringify(differenceObj.deletions) : '[]');
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(sourceId) + '/conflicts/resolution', fd, config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getResource
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource
     * endpoint and returns the resource compiled starting at the identified Commit.
     *
     * @param {string} commitId The id of the Commit to retrieve the compiled resource from
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {boolean} applyInProgressCommit Whether or not the saved changes in the logged-in User's InProgressCommit
     * should be applied to the resource
     * @param {String} format The RDF format to return the compiled resource in
     * @return {Promise} A promise that resolves to the compiled resource or rejects with an error message.
     */
    self.getResource = function(commitId, branchId, recordId, catalogId, applyInProgressCommit, format = 'jsonld') {
        const config = {
            headers: {
                'Content-Type': undefined,
                'Accept': 'text/plain'
            },
            params: {
                format,
                applyInProgressCommit
            }
        };
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource', config)
            .then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name downloadResource
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource
     * endpoint using the `window.location` variable which will start a download of the compiled resource starting at the
     * identified Commit.
     *
     * @param {string} commitId The id of the Commit to retrieve the compiled resource from
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {boolean} applyInProgressCommit Whether or not the saved changes in the logged-in User's InProgressCommit
     * should be applied to the resource
     * @param {String} format The RDF format to return the compiled resource in
     */
    self.downloadResource = function(commitId, branchId, recordId, catalogId, applyInProgressCommit, format = 'jsonld', fileName = 'resource') {
        const params = $httpParamSerializer({
            applyInProgressCommit: !!applyInProgressCommit,
            format: format || 'jsonld',
            fileName: fileName || 'resource'
        });
        util.startDownload(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?' + params);
    };

    /**
     * @ngdoc method
     * @name createInProgressCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and creates
     * a new InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to create an InProgressCommit for
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the creation was successful or rejects with an error message
     */
    self.createInProgressCommit = function(recordId, catalogId) {
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit')
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getInProgressCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and
     * retrieves the InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to retrieve the InProgressCommit from
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves with the InProgessCommit or rejects with the HTTP response
     */
    self.getInProgressCommit = function(recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit')
            .then(response => response.data, $q.reject);
    };

    /**
     * @ngdoc method
     * @name updateInProgressCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and
     * updates the InProgressCommit for the logged-in User for the identified Record using the additions and
     * deletions JSON-LD provided in the passed difference object.
     *
     * @param {string} recordId The id of the Record to update the InProgressCommit for
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Object} differenceObj An object representing a collection of added and deleted statements
     * @param {Object[]} differenceObj.additions The JSON-LD array of added statements
     * @param {Object[]} differenceObj.deletions The JSON-LD array of deleted statements
     * @return {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateInProgressCommit = function(recordId, catalogId, differenceObj) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        if (has(differenceObj, 'additions')) {
            fd.append('additions', JSON.stringify(differenceObj.additions));
        }
        if (has(differenceObj, 'deletions')) {
            fd.append('deletions', JSON.stringify(differenceObj.deletions));
        }
        return $http.put(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit', fd, config)
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name deleteInProgressCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and deletes
     * the InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to delete the InProgressCommit from
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @return {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteInProgressCommit = function(recordId, catalogId) {
        return $http.delete(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit')
            .then(response => $q.resolve(), util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getEntityName
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Collects the name of the passed entity or returns an anonymous name if it could not be generated.
     *
     * @param {Object} entity A JSON-LD object to create the name for
     * @return {string} A name to represent the passed entity
     */
    self.getEntityName = function(entity) {
        return util.getDctermsValue(entity, 'title') || '(Anonymous)';
    };

    /**
     * @ngdoc method
     * @name isRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Record or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Record type; false otherwise
     */
    self.isRecord = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Record');
    };

    /**
     * @ngdoc method
     * @name isVersionedRDFRecord
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a VersionedRDFRecord or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the VersionedRDFRecord type; false otherwise
     */
    self.isVersionedRDFRecord = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'VersionedRDFRecord');
    };

    /**
     * @ngdoc method
     * @name isDistribution
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Distribution or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Distribution type; false otherwise
     */
    self.isDistribution = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Distribution');
    };

    /**
     * @ngdoc method
     * @name isBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Branch or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Branch type; false otherwise
     */
    self.isBranch = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Branch');
    };

    /**
     * @ngdoc method
     * @name isUserBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a user branch or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the UserBranch type; false otherwise
     */
    self.isUserBranch = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'UserBranch');
    };

    /**
     * @ngdoc method
     * @name isVersion
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Version or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Version type; false otherwise
     */
    self.isVersion = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Version');
    };

    /**
     * @ngdoc method
     * @name isTag
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Tag or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Tag type; false otherwise
     */
    self.isTag = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Tag');
    };

    /**
     * @ngdoc method
     * @name isCommit
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Tests whether the passed entity is a Commit or not.
     *
     * @param {Object} entity A JSON-LD object
     * @return {boolean} True if the entity contains the Commit type; false otherwise
     */
    self.isCommit = function(entity) {
        return includes(get(entity, '@type', []), prefixes.catalog + 'Commit');
    };

    function createVersion(recordId, catalogId, versionConfig) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('title', versionConfig.title);
        fd.append('type', versionConfig.type);
        if (has(versionConfig, 'description')) {
            fd.append('description', versionConfig.description);
        }
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions', fd, config)
            .then(response => response.data, util.rejectError);
    }

    function createBranch(recordId, catalogId, branchConfig, commitId) {
        const fd = new FormData(),
            config = {
                transformRequest: identity,
                headers: {
                    'Content-Type': undefined
                }
            };
        fd.append('title', branchConfig.title);
        fd.append('type', branchConfig.type);
        fd.append('commitId', commitId);
        if (has(branchConfig, 'description')) {
            fd.append('description', branchConfig.description);
        }
        return $http.post(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches', fd, config)
            .then(response => response.data, util.rejectError);
    }

    function getRecordVersion(versionIdentifier, recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + versionIdentifier)
            .then(response => response.data, util.rejectError);
    }

    function getRecordBranch(branchIdentifier, recordId, catalogId) {
        return $http.get(prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + branchIdentifier)
            .then(response => response.data, util.rejectError);
    }

    function setDefaultSort(configParams) {
        if (!has(configParams, 'sort')) {
            configParams.sort = self.sortOptions[0].field;
            configParams.ascending = self.sortOptions[0].asc;
        }
    }
}

export default catalogManagerService;