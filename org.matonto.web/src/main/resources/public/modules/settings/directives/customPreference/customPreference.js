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
         * @name customPreference
         *
         * @description
         * The `customPreference` module only provides the `customPreference` directive which creates
         * an article with transcluded content and a customizable header and question representing
         * the setting.
         */
        .module('customPreference', [])
        /**
         * @ngdoc directive
         * @name customPreference.directive:customPreference
         * @scope
         * @restrict E
         *
         * @description
         * `customPreference` is a directive that creates an article with transcluded content, a header, and
         * a question representing what the setting is for. The main content for the overlay is transcluded
         * so it can contain whatever is put between the opening and closing tags. The directive is replaced
         * by the content of its template.
         *
         * @param {string} header the text to display in the article's header
         * @param {string} question the text to display as the setting's representative question
         */
        .directive('customPreference', customPreference);

        function customPreference() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    header: '=',
                    question: '='
                },
                templateUrl: 'modules/settings/directives/customPreference/customPreference.html'
            }
        }
})();
