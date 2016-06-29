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
        .module('prefixManager', ['updateRefs'])
        .service('prefixManagerService', prefixManagerService);

        prefixManagerService.$inject = ['$q', 'updateRefsService'];

        function prefixManagerService($q, updateRefsService) {
            var self = this;

            function updateContext(context, prop, old, fresh) {
                var i = 0;
                while(i < context.length) {
                    if(context[i][prop] === old) {
                        context[i][prop] = fresh;
                        break;
                    }
                    i++;
                }
            }

            self.editPrefix = function(edit, old, index, ontology) {
                var input = document.getElementById('prefix-' + index);
                if(edit) {
                    updateRefsService.update(ontology, old + ':', input.value + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'key', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.editValue = function(edit, key, old, index, ontology) {
                var input = document.getElementById('value-' + index);
                if(edit) {
                    updateRefsService.update(ontology, key + ':', old, ontology.matonto.owl);
                    updateRefsService.update(ontology, input.value, key + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'value', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.add = function(key, value, ontology) {
                var deferred = $q.defer(),
                    context = ontology.matonto.context,
                    duplicate = _.findIndex(context, { 'key': key }) !== -1 || _.findIndex(context, { 'value': value }) !== -1;

                if(!duplicate) {
                    context.push({key: key, value: value});
                    updateRefsService.update(ontology, value, key + ':', ontology.matonto.owl);
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            }

            self.remove = function(key, ontology) {
                var i = 0;

                while(i < ontology.matonto.context.length) {
                    if(ontology.matonto.context[i].key === key) {
                        updateRefsService.update(ontology, key + ':', ontology.matonto.context[i].value, ontology.matonto.owl);
                        ontology.matonto.context.splice(i, 1);
                        break;
                    }
                    i++;
                }
            }
        }
})();