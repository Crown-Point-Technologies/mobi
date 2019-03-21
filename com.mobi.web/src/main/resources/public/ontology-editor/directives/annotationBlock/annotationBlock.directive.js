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

    angular
        /**
         * @ngdoc overview
         * @name annotationBlock
         *
         * @description
         * The `annotationBlock` module only provides the `annotationBlock` directive which creates a section for
         * displaying the annotations on an entity.
         */
        .module('annotationBlock', [])
        /**
         * @ngdoc directive
         * @name annotationBlock.directive:annotationBlock
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:modalService
         *
         * @description
         * `annotationBlock` is a directive that creates a section that displays the annotations on the
         * {@link shared.service:ontologyStateService selected entity} using
         * {@link propertyValues.directive:propertyValues}. The section header contains a button for adding an
         * annotation. The directive houses the methods for opening the modal for
         * {@link annotationOverlay.directive:annotationOverlay editing, adding}, and removing annotations. The
         * directive is replaced by the contents of its template.
         */
        .directive('annotationBlock', annotationBlock);

        annotationBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

        function annotationBlock(ontologyStateService, ontologyUtilsManagerService, propertyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/annotationBlock/annotationBlock.directive.html',
                scope: {},
                bindToController: {
                    highlightIris: '<',
                    highlightText: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.annotations = [];

                    dvm.$onInit = function() {
                        dvm.annotations = _.union(_.keys(dvm.os.listItem.annotations.iris), pm.defaultAnnotations, pm.owlAnnotations);
                    }
                    dvm.openAddOverlay = function() {
                        dvm.os.editingAnnotation = false;
                        dvm.os.annotationSelect = undefined;
                        dvm.os.annotationValue = '';
                        dvm.os.annotationType = undefined;
                        dvm.os.annotationIndex = 0;
                        dvm.os.annotationLanguage = 'en';
                        modalService.openModal('annotationOverlay');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index);
                        });
                    }
                    dvm.editClicked = function(annotation, index) {
                        var annotationObj = dvm.os.listItem.selected[annotation][index];
                        dvm.os.editingAnnotation = true;
                        dvm.os.annotationSelect = annotation;
                        dvm.os.annotationValue = annotationObj['@value'];
                        dvm.os.annotationIndex = index;
                        dvm.os.annotationType = _.get(annotationObj, '@type');
                        dvm.os.annotationLanguage = _.get(annotationObj, '@language');
                        modalService.openModal('annotationOverlay');
                    }
                }
            }
        }
})();