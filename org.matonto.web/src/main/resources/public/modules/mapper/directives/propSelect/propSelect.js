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
         * @name propSelect
         *
         * @description 
         * The `propSelect` module only provides the `propSelect` directive which creates
         * a ui-select with the passed property list, a selected property, and an optional
         * function to be called when the selected property changes.
         */
        .module('propSelect', [])
        /**
         * @ngdoc directive
         * @name propSelect.directive:propSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `propSelect` is a directive which creates a ui-select with the passed property 
         * list, a selected property object, and an optional function to be called when 
         * the selected property is changed. The directive is replaced by the contents of 
         * its template.
         *
         * @param {object[]} props an array of property objects from the {@link ontologyManager.service:ontologyMangerService ontologyMangerService}
         * @param {function} [onChange=undefined] an optional function to be called on change 
         * of the selected property
         * @param {object} selectedProp the currently selected property object
         * @param {string} selectedProp['@id'] the IRI of the property
         */
        .directive('propSelect', propSelect);

        propSelect.$inject = ['ontologyManagerService'];

        function propSelect(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '<',
                    isDisabledWhen: '=',
                    onChange: '&'
                },
                bindToController: {
                    selectedProp: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                },
                templateUrl: 'modules/mapper/directives/propSelect/propSelect.html'
            }
        }
})();
