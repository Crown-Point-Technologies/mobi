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
        .module('languageSelect', [])
        .directive('languageSelect', languageSelect);

        languageSelect.$inject = [];

        function languageSelect() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/languageSelect/languageSelect.html',
                scope: {
                    required: '<?'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.languages = [{
                        label: 'English',
                        value: 'en'
                    }, {
                        label: 'French',
                        value: 'fr'
                    }, {
                        label: 'Spanish',
                        value: 'es'
                    }, {
                        label: 'Arabic',
                        value: 'ar'
                    }, {
                        label: 'Japanese',
                        value: 'ja'
                    }, {
                        label: 'Italian',
                        value: 'it'
                    }, {
                        label: 'German',
                        value: 'de'
                    }, {
                        label: 'Chinese',
                        value: 'zh'
                    }, {
                        label: 'Portuguese',
                        value: 'pt'
                    }];

                    dvm.clear = function() {
                        dvm.bindModel = undefined;
                    }
                },
                link: function(scope, element, attrs) {
                    scope.required = 'required' in attrs;
                }
            }
        }
})();
