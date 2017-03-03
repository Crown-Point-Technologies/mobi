/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
         * @name delimitedManager
         *
         * @description
         * The `delimitedManager` module only provides the `delimitedManagerService` service which
         * provides access to the MatOnto CSV REST endpoints and variable to hold data
         * pertaining to the results of these endpoints.
         */
        .module('delimitedManager', [])
        /**
         * @ngdoc service
         * @name delimitedManager.service:delimitedManagerService
         * @requires $http
         * @requires $q
         * @requires $window
         *
         * @description
         * `delimitedManagerService` is a service that provides access to the MatOnto CSV REST
         * endpoints and various variables to hold data pertaining to the parameters
         * passed to the endpoints and the results of the endpoints.
         */
        .service('delimitedManagerService', delimitedManagerService);

        delimitedManagerService.$inject = ['$http', '$httpParamSerializer', '$q', '$window'];

        function delimitedManagerService($http, $httpParamSerializer, $q, $window) {
            var self = this,
                prefix = '/matontorest/delimited-files';


            /**
             * @ngdoc property
             * @name dataRows
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {string}
             *
             * @description
             * `dataRows` holds an array of a preview of delimited data. Set by the
             * POST /matontorest/delimited-files endpoint
             */
            self.dataRows = undefined;
            /**
             * @ngdoc property
             * @name fileName
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {string}
             *
             * @description
             * `fileName` holds a string with the name of the uploaded delimited file given
             * back from the POST /matontorest/delimited-files endpoint
             * endpoint calls.
             */
            self.fileName = '';
            /**
             * @ngdoc property
             * @name separator
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {string}
             *
             * @description
             * `separator` holds a string with the character separating columns in the uploaded
             * delimited file if it is an SV file. It is used in the GET /matontorest/delimited-files/{fileName},
             * the POST /matontorest/delimited-files/{fileName}/map, and the
             * GET /matontorest/delimited-files/{fileName}/map
             * endpoints calls.
             */
            self.separator = ',';
            /**
             * @ngdoc property
             * @name containsHeaders
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {boolean}
             *
             * @description
             * `separator` holds a boolean indicating whether the uploaded delimited file contains a
             * header row or not. It is used in the GET /matontorest/delimited-files/{fileName}, the POST
             * /matontorest/delimited-files/{fileName}/map-preview, and the
             * GET /matontorest/delimited-files/{fileName}/map
             * endpoints calls.
             */
            self.containsHeaders = true;
            /**
             * @ngdoc property
             * @name preview
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {string/Object}
             *
             * @description
             * `preview` holds a string or Object containing a preview of mapped data to be used in the
             * {@link rdfPreview.directive:rdfPreview RDF Preview} directive.
             */
            self.preview = '';
            /**
             * @ngdoc property
             * @name serializeFormat
             * @propertyOf delimitedManager.service:delimitedManagerService
             * @type {string/Object}
             *
             * @description
             * `serializeFormat` holds a string containing the format for the preview to be used in the
             * {@link rdfPreview.directive:rdfPreview RDF Preview} directive.
             */
            self.serializeFormat = 'turtle';

            /**
             * @ngdoc method
             * @name upload
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Makes a call to POST /matontorest/delimited-files to upload the passed File object to the repository.
             * Returns the resulting file name is a promise.
             *
             * @param {object} file a File object to upload (should be a SV or Excel file)
             * @return {Promise} A Promise that resolves to the name of the uploaded delimited file; rejects with an
             * error message otherwise
             */
            self.upload = function(file) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            'Accept': 'text/plain'
                        }
                    };
                fd.append('delimitedFile', file);
                $http.post(prefix, fd, config)
                    .then(response => deferred.resolve(response.data), error => onError(error, deferred));

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name previewFile
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Makes a call to GET /matontorest/delimited-files/{fileName} to retrieve the passed in number of rows
             * of an uploaded delimited file. Uses {@link delimitedManager.delimitedManager#separator separator} and
             * {@link delimitedManager.delimitedManager#fileName fileName} to make the call. Depending on the value
             * of {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, either uses the first
             * returned row as headers or generates headers of the form "Column " + index. Sets the value
             * of {@link delimitedManager.delimitedManager#dataRows dataRows}. Returns a Promise indicating the
             * success of the REST call.
             *
             * @param {number} rowEnd the number of rows to retrieve from the uploaded delimited file
             * @return {Promise} A Promise that resolves if the call succeeded; rejects if the preview was empty
             * or the call did not succeed
             */
            self.previewFile = function(rowEnd) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            'rowCount': rowEnd ? rowEnd : 0,
                            'separator': self.separator
                        }
                    };
                $http.get(prefix + '/' + encodeURIComponent(self.fileName), config)
                    .then(response => {
                        if (response.data.length === 0) {
                            self.dataRows = undefined;
                            deferred.reject("No rows were found");
                        } else {
                            self.dataRows = response.data;
                            deferred.resolve();
                        }
                    }, error => {
                        self.dataRows = undefined;
                        onError(error, deferred);
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name previewMap
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Makes a call to POST /matontorest/delimited-files/{fileName}/map-preview to retrieve the first 10 rows of
             * delimited data mapped into RDF data using the passed in JSON-LD mapping and returns the RDF
             * data in the passed in format. Uses {@link delimitedManager.delimitedManager#separator separator},
             * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, and
             * {@link delimitedManager.delimitedManager#fileName fileName} to make the call. If the format is "jsonld,"
             * sends the request with an Accept header of "applciation/jsond". Otherwise, sends the request
             * with an Accept header of "text/plain". Returns a Promise with the result of the endpoint call.
             *
             * @param {object[]} jsonld the JSON-LD of a mapping
             * @param {string} format the RDF serialization format to return the mapped data in
             * @return {Promise} A Promise that resolves with the mapped data in the specified RDF format
             */
            self.previewMap = function(jsonld, format) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'format': format,
                            'containsHeaders': self.containsHeaders,
                            'separator': self.separator
                        },
                        headers: {
                            'Content-Type': undefined,
                            'Accept': (format === 'jsonld') ? 'application/json' : 'text/plain'
                        }
                    };
                fd.append('jsonld', angular.toJson(jsonld));
                $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map-preview', fd, config)
                    .then(response => deferred.resolve(response.data), error => onError(error, deferred));
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name mapAndDownload
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Opens the current window to the location of GET /matontorest/delimited-files/{fileName}/map which
             * will start a file download of the complete mapped delimited data in the specified format
             * of an uploaded delimited file using a saved Mapping identified by the passed IRI. Uses
             * {@link delimitedManager.delimitedManager#separator separator},
             * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, and
             * {@link delimitedManager.delimitedManager#fileName fileName} to create the URL to set the window
             * location to.
             *
             * @param {string} mappingIRI the IRI of a saved Mapping
             * @param {string} format the RDF format for the mapped data
             * @param {string} fileName the file name for the downloaded mapped data
             */
            self.mapAndDownload = function(mappingIRI, format, fileName) {
                var params = {
                    containsHeaders: self.containsHeaders,
                    separator: self.separator,
                    format,
                    mappingIRI
                };
                if (fileName) {
                    params.fileName = fileName;
                }
                $window.location = prefix + '/' + encodeURIComponent(self.fileName) + '/map?' + $httpParamSerializer(params);
            }

            /**
             * @ngdoc method
             * @name mapAndUpload
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Calls the POST /matontorest/delimited-files/{fileName}/map to map the data of an uploaded delimited file
             * using a saved Mapping identified by the passed IRI into the Dataset associated with the DatasetRecord
             * identified by the passed IRI. Returns a Promise indicating the success of the request.
             *
             * @param {string} mappingIRI the IRI of a saved Mapping
             * @param {string} datasetRecordIRI the IRI of a DatasetRecord
             * @return {Promise} A Promise that resolves if the upload was successful; rejects with an error message otherwise
             */
            self.mapAndUpload = function(mappingIRI, datasetRecordIRI) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            mappingIRI,
                            datasetRecordIRI,
                            containsHeaders: this.containsHeaders,
                            separator: this.separator
                        }
                    };
                $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map', null, config)
                    .then(deferred.resolve, error => onError(error, deferred));
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getHeader
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Retrieves the header name of a column based on its index. If
             * {@link delimitedManager.service:delimitedManagerService#dataRows data rows} have been
             * set and {@link delimitedManager.service:delimitedManagerService#containsHeaders contain headers},
             * collects the header name from the first row. Otherwise, generates a name using the index.
             *
             * @param {number/string} index The index number of the column to retrieve the header name from
             * @return {string} A header name for the column at the specified index
             */
            self.getHeader = function(index) {
                return self.containsHeaders && self.dataRows ? _.get(self.dataRows[0], index, `Column ${index}`) : `Column ${index}`;
            }

            /**
             * @ngdoc method
             * @name reset
             * @methodOf delimitedManager.service:delimitedManagerService
             *
             * @description
             * Resets the values of {@link delimitedManager.delimitedManager#dataRows dataRows}
             * {@link delimitedManager.delimitedManager#preview preview},
             * {@link delimitedManager.delimitedManager#fileName fileName},
             * {@link delimitedManager.delimitedManager#separator separator}, and
             * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders} back to their default
             * values.
             */
            self.reset = function() {
                self.dataRows = undefined;
                self.fileName = '';
                self.separator = ',';
                self.containsHeaders = true;
                self.preview = '';
            }

            function onError(error, deferred) {
                deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
            }
        }
})();
