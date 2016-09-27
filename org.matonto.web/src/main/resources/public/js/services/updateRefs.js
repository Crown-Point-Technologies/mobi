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
         * @name updateRefs
         * @requires responseObj
         * 
         * @description 
         * The `updateRefs` module only provides the `updateRefs` service which changes every 
         * instance of a certain key in an object from 
         * {@link ontologyManager.service:ontologyManager ontologyManager} to a new string.
         */
        .module('updateRefs', ['responseObj'])
        /**
         * @ngdoc service
         * @name updateRefs.service:updateRefsService
         * @requires $filter
         * @requires responseObj.responseObj
         *
         * @description 
         * `updateRefsService` is a service that provides functionality to uypdate references 
         * in an object from {@link ontologyManager.service:ontologyManager ontologyManager}.
         */
        .service('updateRefsService', updateRefsService);

    updateRefsService.$inject = ['$filter', 'responseObj'];

    function updateRefsService($filter, responseObj) {
        var self = this;
        var exclude = [
                '$$hashKey',
                'originalIRI',
                'unsaved',
                'valid',
                'ontologyId'
            ];

        /**
         * @ngdoc method
         * @name update
         * @methodOf updateRefs.service:updateRefsService
         *
         * @description 
         * Changes every instance of a specific key in an object from 
         * {@link ontologyManager.service:ontologyManager ontologyManager} to a new string.
         * It directly affects the passed in object instead of creating a new copy.
         * 
         * @param {Object} obj An object from {@link ontologyManager.service:ontologyManager ontologyManager}.
         * Presumedly it is an ontology object.
         * @param {string} old The original key string that will be updated
         * @param {string} fresh The new string to change the old key into
         */
        self.update = function(obj, old, fresh) {
            var freshSplit = $filter('splitIRI')(fresh);
            // iterates over all of the properties of the object
            _.forOwn(obj, (value, key) => {
                var excluded = _.indexOf(exclude, key);
                // replaces the key if it is the old value
                if (key === old && excluded === -1) {
                    delete obj[key];
                    obj[fresh] = value;
                }
                if (!(excluded !== -1 || !obj[key])) {
                    // checks all items in the array
                    if (_.isArray(value)) {
                        _.forEach(value, (item, index) => {
                            // checks to see if it contains the old value
                            if (item === old) {
                                obj[key][index] = fresh;
                            }
                            // not a string, so update it
                            else if (responseObj.validateItem(item) && responseObj.getItemIri(item) === old) {
                                obj[key][index].localName = freshSplit.end;
                                obj[key][index].namespace = freshSplit.begin + freshSplit.then;
                            }
                            // not a string, so update it
                            else if (typeof item !== 'string') {
                                self.update(obj[key][index], old, fresh);
                            }
                        });
                    }
                    // objects need to be updated
                    else if (typeof value === 'object') {
                        self.update(obj[key], old, fresh);
                    }
                    // change string value if it matches
                    else if (value === old) {
                        obj[key] = fresh;
                    }
                }
            });
        }
        /**
         * @ngdoc method
         * @name remove
         * @methodOf updateRefs.service:updateRefsService
         *
         * @description
         * Removes every instance of a specific key in an object from
         * {@link ontologyManager.service:ontologyManager ontologyManager}. It directly
         * affects the passed in object instead of creating a new copy.
         *
         * @param {Object} obj An object from {@link ontologyManager.service:ontologyManager ontologyManager}.
         * Presumably it is an ontology object.
         * @param {string} word The original string that will be removed
         */
        self.remove = function(obj, word) {
            _.forOwn(obj, (value, key) => {
                if (_.isArray(value)) {
                    _.remove(value, item => item === word);
                    _.forEach(value, (item, index) => {
                        if (typeof item !== 'string') {
                            self.remove(item, word);
                        }
                    });
                    _.remove(value, item =>
                        _.isEqual(item, {}) || (_.keys(item).length === 1 && _.has(item, '$$hashKey')));
                    if (!value.length) {
                        _.unset(obj, key);
                    }
                } else if (typeof value === 'object') {
                    self.remove(value, word);
                    if (_.isEqual(value, {})) {
                        _.unset(obj, key);
                    }
                } else if (value === word) {
                    _.unset(obj, key);
                }
            });
        }
    }
})();