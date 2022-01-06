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

import { has, head, map, get, forEach, omit, find, mergeWith, isArray } from 'lodash';

import './commitCompiledResource.component.scss';

const template = require('./commitCompiledResource.component.html');

/**
 * @ngdoc component
 * @name shared.component:commitCompiledResource
 * @requires shared.service:httpService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `commitCompiledResource` is a component that displays the compiled resource of the entity identified by the
 * provided `commitId` starting at the commit identified by the provided `commitId`. The display will include all
 * deleted statements from the commit styled to be easily identified. All added statements in the commit will also
 * be styled to be easily identified.
 *
 * @param {string} commitId The IRI string of a commit in the local catalog
 * @param {string} entityId entityId The IRI string of the entity to display
 * @param {Function} [entityNameFunc=undefined] An optional function to control how entity names are displayed.
 */
const commitCompiledResourceComponent = {
    template,
    bindings: {
        commitId: '<',
        entityId: '<',
        entityNameFunc: '<'
    },
    controllerAs: 'dvm',
    controller: commitCompiledResourceComponentCtrl
};

commitCompiledResourceComponentCtrl.$inject = ['$q', 'httpService', 'catalogManagerService', 'utilService'];

function commitCompiledResourceComponentCtrl($q, httpService, catalogManagerService, utilService) {
    var dvm = this;
    var cm = catalogManagerService;
    dvm.util = utilService;

    dvm.error = '';
    dvm.resource = undefined;
    dvm.types = [];
    dvm.id = 'commit-compiled-resource';

    dvm.$onChanges = function(changes) {
        if (has(changes, 'commitId') || has(changes, 'entityId')) {
            dvm.setResource();
        }
    }
    dvm.setResource = function() {
        if (dvm.commitId) {
            httpService.cancel(dvm.id);
            cm.getCompiledResource(dvm.commitId, dvm.entityId, dvm.id)
                .then(resources => {
                    var resource : any = head(resources) || {};
                    dvm.types = map(get(resource, '@type', []), type => ({type}));
                    dvm.resource = omit(resource, ['@id', '@type']);
                    return cm.getDifferenceForSubject(dvm.entityId, dvm.commitId);
                }, $q.reject)
                .then(response => {
                    var additionsObj = find(response.additions, {'@id': dvm.entityId});
                    var deletionsObj = find(response.deletions, {'@id': dvm.entityId});
                    forEach(get(additionsObj, '@type'), addedType => {
                        var typeObj = find(dvm.types, {type: addedType});
                        typeObj.add = true;
                    });
                    dvm.types = dvm.types.concat(map(get(deletionsObj, '@type', []), type => ({type, del: true})));
                    var additions = omit(additionsObj, ['@id', '@type']);
                    var deletions = omit(deletionsObj, ['@id', '@type']);
                    forEach(additions, (values, prop) => {
                        forEach(values, value => {
                            var resourceVal: any = find(dvm.resource[prop], value);
                            if (resourceVal) {
                                resourceVal.add = true;
                            }
                        });
                    });
                    forEach(deletions, (values, prop) => {
                        forEach(values, value => { value.del = true });
                    });
                    mergeWith(dvm.resource, deletions, (objValue, srcValue) => {
                        if (isArray(objValue)) {
                            return objValue.concat(srcValue);
                        }
                    });
                    dvm.error = '';
                }, errorMessage => {
                    dvm.error = errorMessage;
                    dvm.resource = undefined;
                    dvm.types = [];
                });
        } else {
            dvm.resource = undefined;
            dvm.types = [];
        }
    }
}

export default commitCompiledResourceComponent;
