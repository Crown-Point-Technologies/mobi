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
         * @name passwordConfirmInput
         *
         * @description
         * The `passwordConfirmInput` module provides the `passwordConfirmInput` directive, which
         * creates two password inputs whose values much match, and the `samePassword` directive,
         * which is used for testing whether the values of the two password inputs match.
         */
        .module('passwordConfirmInput', [])
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:passwordConfirmInput
         * @scope
         * @restrict E
         *
         * @description
         * `passwordConfirmInput` is a directive that creates two password inputs with validation
         * to make sure the values of the inputs match each other. TheSecond input is required if
         * the first  input has a value, but the first can also be optionally set to required as well.
         * The directive is replaced by the contents of its template.
         *
         * @param {string} password the value to bind to the first password input
         * @param {string} toConfirm the value to bind to the second password input
         * @param {string} label the label for the first password input
         * @param {boolean} [required=false] whether or not the inputs should be required
         */
        .directive('passwordConfirmInput', passwordConfirmInput)
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:samePassword
         * @restrict A
         *
         * @description
         * `samePassword` is a directive which tests whether the ngModel value is the same as the
         * evaluated value of the password variable. It requires the parent element to have an ngModel.
         * If the ngModel value does not match the evaluated value, it sets the samePassword validity
         * of the parent element to false.
         */
        .directive('samePassword', samePassword);

        function samePassword() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, el, attrs, ctrl) {
                    ctrl.$validators.samePassword = function(modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        if (ctrl.$isEmpty(value)) {
                            return true;
                        }
                        return value === scope.$eval(attrs.samePassword);
                    }
                }
            }
        }
        function passwordConfirmInput() {
            return {
                restrict: 'E',
                require: '^form',
                replace: true,
                controllerAs: 'dvm',
                scope: {
                    password: '=',
                    label: '<',
                    required: '<?'
                },
                link: function(scope, el, attrs, form) {
                    scope.form = form;
                    scope.required = angular.isDefined(scope.required) ? scope.required : false;
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'directives/passwordConfirmInput/passwordConfirmInput.html'
            }
        }
})();
