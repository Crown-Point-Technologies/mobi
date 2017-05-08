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
        .module('propertyHierarchyBlock', [])
        .directive('propertyHierarchyBlock', propertyHierarchyBlock);

        propertyHierarchyBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'INDENT'];

        function propertyHierarchyBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyHierarchyBlock/propertyHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.utils = ontologyUtilsManagerService;

                    dvm.deleteProperty = function() {
                        if (dvm.om.isObjectProperty(dvm.os.selected)) {
                            dvm.utils.deleteObjectProperty();
                        } else if (dvm.om.isDataTypeProperty(dvm.os.selected)) {
                            dvm.utils.deleteDataTypeProperty();
                        } else if (dvm.om.isAnnotation(dvm.os.selected)) {
                            dvm.utils.deleteAnnotationProperty();
                        }
                        dvm.showDeleteConfirmation = false;
                    }
                    
                    dvm.isShown = function(node) {
                        return !_.has(node, 'entityIRI') || (dvm.os.areParentsOpen(node) && node.get(dvm.os.listItem.recordId));
                    }
                    
                    dvm.flatPropertyTree = constructFlatPropertyTree();
                    
                    function addGetToArrayItems(array, get) {
                        return _.map(array, item => _.merge(item, {get}));
                    }
                    
                    function constructFlatPropertyTree() {
                        var result = [];
                        if (dvm.os.listItem.flatDataPropertyHierarchy.length) {
                            result.push({
                                title: 'Data Properties',
                                get: dvm.os.getDataPropertiesOpened,
                                set: dvm.os.setDataPropertiesOpened
                            });
                            result = _.concat(result, addGetToArrayItems(dvm.os.listItem.flatDataPropertyHierarchy, dvm.os.getDataPropertiesOpened));
                        }
                        if (dvm.os.listItem.flatObjectPropertyHierarchy.length) {
                            result.push({
                                title: 'Object Properties',
                                get: dvm.os.getObjectPropertiesOpened,
                                set: dvm.os.setObjectPropertiesOpened
                            });
                            result = _.concat(result, addGetToArrayItems(dvm.os.listItem.flatObjectPropertyHierarchy, dvm.os.getObjectPropertiesOpened));
                        }
                        if (dvm.os.listItem.flatAnnotationPropertyHierarchy.length) {
                            result.push({
                                title: 'Annotation Properties',
                                get: dvm.os.getAnnotationPropertiesOpened,
                                set: dvm.os.setAnnotationPropertiesOpened
                            });
                            result = _.concat(result, addGetToArrayItems(dvm.os.listItem.flatAnnotationPropertyHierarchy, dvm.os.getAnnotationPropertiesOpened));
                        }
                        return result;
                    }
                    
                    $scope.$watch('dvm.os.listItem.flatDataPropertyHierarchy', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                    $scope.$watch('dvm.os.listItem.flatObjectPropertyHierarchy', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                    $scope.$watch('dvm.os.listItem.flatAnnotationPropertyHierarchy', () => {
                        dvm.flatPropertyTree = constructFlatPropertyTree();
                    });
                }]
            }
        }
})();
