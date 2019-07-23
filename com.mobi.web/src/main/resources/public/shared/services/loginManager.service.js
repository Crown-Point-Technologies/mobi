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
(function() {
    'use strict';

    loginManagerService.$inject = ['$q', '$http', '$state', 'REST_PREFIX',
        'catalogManagerService',
        'catalogStateService',
        'datasetManagerService',
        'datasetStateService',
        'delimitedManagerService',
        'discoverStateService',
        'mapperStateService',
        'mergeRequestsStateService',
        'ontologyManagerService',
        'ontologyStateService',
        'sparqlManagerService',
        'stateManagerService',
        'userManagerService',
        'userStateService'
    ];

    /**
     * @ngdoc service
     * @name shared.service:loginManagerService
     * @requires $http
     * @requires $q
     * @requires $state
     * @requires shared.service:catalogManagerService
     * @requires shared.service:catalogStateService
     * @requires shared.service:datasetManagerService
     * @requires shared.service:datasetStateService
     * @requires shared.service:delimitedManangerService
     * @requires shared.service:discoverStateService
     * @requires shared.service:mapperStateService
     * @requires shared.service:mergeRequestsStateService
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:sparqlManagerService
     * @requires shared.service:stateManagerService
     * @requires shared.service:userManagerService
     * @requires shared.service:userStateService
     *
     * @description
     * `loginManagerService` is a service that provides access to the Mobi login REST
     * endpoints so users can log into and out of Mobi.
     */
    function loginManagerService($q, $http, $state, REST_PREFIX, catalogManagerService, catalogStateService, datasetManagerService, datasetStateService, delimitedManagerService, discoverStateService, mapperStateService, mergeRequestsStateService, ontologyManagerService, ontologyStateService, sparqlManagerService, stateManagerService, userManagerService, userStateService) {
        var self = this,
            anon = 'self anon',
            prefix = REST_PREFIX + 'session';
        
        self.weGood = false;

        /**
         * @ngdoc property
         * @name currentUser
         * @propertyOf shared.service:loginManagerService
         * @type {string}
         *
         * @description
         * `currentUser` holds the username of the user that is currently logged into Mobi.
         */
        self.currentUser = '';

        /**
         * @ngdoc property
         * @name currentUserIRI
         * @propertyOf shared.service:loginManagerService
         * @type {string}
         *
         * @description
         * `currentUserIRI` holds the IRI of the user that is currenlty logged into Mobi.
         */
        self.currentUserIRI = '';

        /**
         * @ngdoc method
         * @name loginManager.loginManagerService#login
         * @methodOf shared.service:loginManagerService
         *
         * @description
         * Makes a call to POST /mobirest/session to attempt to log into Mobi using the passed credentials. Returns a
         * Promise with the success of the log in attempt. If failed, contains an appropriate error message.
         *
         * @param {string} username the username to attempt to log in with
         * @param {string} password the password to attempt to log in with
         * @return {Promise} A Promise that resolves if the log in attempt succeeded and rejects
         * with an error message if the log in attempt failed
         */
        self.login = function(username, password) {
            var config = { params: { username, password } };
            return $http.post(prefix, null, config)
                .then(response => {
                    if (response.status === 200 && response.data.scope !== anon) {
                        self.currentUser = response.data.sub;
                        return userManagerService.getUser(self.currentUser)
                            .then(user => {
                                self.currentUserIRI = user.iri;
                                $state.go('root.home');
                                return true;
                            });
                    }
                }, response => {
                    if (response.status === 401) {
                        return $q.reject('This email/password combination is not correct.');
                    } else {
                        return $q.reject('An error has occurred. Please try again later.');
                    }
                });
        }

        /**
         * @ngdoc method
         * @name loginManager.loginManagerService#logout
         * @methodOf shared.service:loginManagerService
         *
         * @description
         * Makes a call to DELETE /mobirest/session to log out of which ever user account is current. Navigates back to
         * the login page.
         */
        self.logout = function() {
            datasetStateService.reset();
            delimitedManagerService.reset();
            discoverStateService.reset();
            mapperStateService.initialize();
            mapperStateService.resetEdit();
            mergeRequestsStateService.reset();
            ontologyManagerService.reset();
            ontologyStateService.reset();
            sparqlManagerService.reset();
            catalogStateService.reset();
            $http.delete(prefix)
                .then(response => {
                    self.currentUser = '';
                    self.currentUserIRI = '';
                    userStateService.reset();
                    $state.go('login');
                });
        }

        /**
         * @ngdoc method
         * @name loginManager.loginManagerService#isAuthenticated
         * @methodOf shared.service:loginManagerService
         *
         * @description
         * Test whether a user is currently logged in and if not, navigates to the log in page. If a user
         * is logged in, initializes the {@link shared.service:catalogManagerService},
         * {@link shared.service:catalogStateService},
         * {@link shared.service:mergeRequestsStateService},
         * {@link shared.service:ontologyManagerService},
         * {@link shared.service:ontologyStateService},
         * {@link shared.service:datasetManagerService},
         * {@link shared.service:stateManagerService},
         * and the {@link shared.service:userManagerService}. Returns
         * a Promise with whether or not a user is logged in.
         *
         * @return {Promise} A Promise that resolves if a user is logged in and rejects with the HTTP
         * response data if no user is logged in.
         */
        self.isAuthenticated = function() {
            var handleError = function(data) {
                self.currentUser = '';
                self.currentUserIRI = '';
                $state.go('login');
            };
            return self.getCurrentLogin().then(data => {
                if (data.scope === anon) {
                    return $q.reject(data);
                }
                self.currentUser = data.sub;
                var promises = [
                    stateManagerService.initialize(),
                    userManagerService.initialize(),
                    userManagerService.getUser(self.currentUser).then(user => {
                        self.currentUserIRI = user.iri;
                    })
                ];
                if (!self.weGood) {
                    promises = promises.concat([
                        catalogManagerService.initialize().then(() => {
                            catalogStateService.initialize();
                            mergeRequestsStateService.initialize();
                            ontologyManagerService.initialize();
                            ontologyStateService.initialize();
                        }),
                        datasetManagerService.initialize()
                    ]);
                }
                return $q.all(promises);
            }, $q.reject)
            .then(() => {
                self.weGood = true;
            }, handleError);
        };

        /**
         * @ngdoc method
         * @name loginManager.loginManagerService#getCurrentLogin
         * @methodOf shared.service:loginManagerService
         *
         * @description
         * Makes a call to GET /mobirest/session to retrieve the user that is currently logged in. Returns a Promise
         * with the result of the call.
         *
         * @return {Promise} A Promise with the response data that resolves if the request was successful; rejects if
         * unsuccessful
         */
        self.getCurrentLogin = function () {
            var deferred = $q.defer();

            $http.get(prefix).then(response => {
                if (response.status === 200) {
                    deferred.resolve(response.data);
                } else {
                    deferred.reject(response.data);
                }
            }, error => deferred.reject(error.data));

            return deferred.promise;
        };
    }

    angular.module('shared')
        .service('loginManagerService', loginManagerService);
})();
