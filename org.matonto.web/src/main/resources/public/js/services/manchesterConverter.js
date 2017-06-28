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
         * @name manchesterConverter
         *
         * @description
         * The `manchesterConverter` module only provides the `manchesterConverterService` service which
         * provides utility functions for converting blank nodes into Manchester Syntax and vice versa.
         */
        .module('manchesterConverter', [])
        /**
         * @ngdoc service
         * @name manchesterConverter.service:manchesterConverterService
         * @requires $filter
         * @requires prefixes.service:prefixes
         * @requires propertyManager.service:ontologyManagerService
         *
         * @description
         * `manchesterConverterService` is a service that provides utility functions for converting JSON-LD
         * blank nodes into Manchester Syntax and vice versa.
         */
        .service('manchesterConverterService', manchesterConverterService);

        manchesterConverterService.$inject = ['$filter', 'ontologyManagerService', 'prefixes'];

        function manchesterConverterService($filter, ontologyManagerService, prefixes) {
            var self = this;
            var om = ontologyManagerService;
            var expressionClassName = 'manchester-expr';
            var restrictionClassName = 'manchester-rest';
            var literalClassName = 'manchester-lit';
            var expressionKeywords = {
                [prefixes.owl + 'unionOf']: ' or ', // A or B
                [prefixes.owl + 'intersectionOf']: ' and ', // A and B
                [prefixes.owl + 'complementOf']: 'not ', // not A
//                [prefixes.owl + 'oneOf']: '' // {a1 a2 ... an}.
            };
                // a - the object property on which the restriction applies.
                // b - the restriction on the property values.
                // n - the cardinality of the restriction.
            var restrictionKeywords = {
                [prefixes.owl + 'someValuesFrom']: ' some ', // a some b
                [prefixes.owl + 'allValuesFrom']: ' only ', // a only b
                [prefixes.owl + 'hasValue']: ' value ', // a value b
                [prefixes.owl + 'minCardinality']: ' min ', // a min n
                [prefixes.owl + 'maxCardinality']: ' max ', // a max n
                [prefixes.owl + 'cardinality']: ' exactly ', // a exactly n
                [prefixes.owl + 'minQualifiedCardinality']: ' min ', // a min n b
                [prefixes.owl + 'maxQualifiedCardinality']: ' max ', // a max n b
                [prefixes.owl + 'qualifiedCardinality']: ' exactly ' // a exactly n b
            };

            /**
             * @ngdoc method
             * @name jsonldToManchester
             * @methodOf manchesterConverter.service:manchesterConverterService
             *
             * @description
             * Converts a blank node identified by the passed id and included in the passed JSON-LD array into a
             * Manchester Syntax string. Includes the Manchester Syntax string for nested blank nodes as well.
             * Currently supports class expressions with "unionOf", "intersectionOf", and "complementOf" and
             * restrictions with "someValuesFrom", "allValuesFrom", "hasValue", "minCardinality", "maxCardinality",
             * and "cardinality". Can optionally surround keywords and literals with HTML tags for formatting displays.
             *
             * @param {string} id The IRI of the blank node to begin with
             * @param {Object[]} jsonld A JSON-LD array of all blank node in question and any supporting blanks
             * nodes needed for the display
             * @param {boolean} html Whether or not the resulting string should include HTML tags for formatting
             * @return {string} A string containing the converted blank node with optional HTML tags for formatting
             */
            self.jsonldToManchester = function(id, jsonld, html = false) {
                var entity = _.find(jsonld, {'@id': id});
                var result = '';
                if (om.isClass(entity)) {
                    var prop = _.intersection(_.keys(entity), _.keys(expressionKeywords));
                    if (prop.length === 1) {
                        var item = _.get(entity[prop[0]], '0');
                        var keyword = html ? surround(expressionKeywords[prop[0]], expressionClassName) : expressionKeywords[prop[0]];
                        if (_.has(item, '@list')) {
                            result += _.join(_.map(_.get(item, '@list'), item =>  getManchesterValue(item, jsonld, html)), keyword);
                        } else {
                            result += keyword + getManchesterValue(item, jsonld, html);
                        }
                    }
                } else if (om.isRestriction(entity)) {
                    var onProperty = _.get(entity, '["' + prefixes.owl + 'onProperty"][0]["@id"]', '');
                    if (onProperty) {
                        var restriction = $filter('splitIRI')(onProperty).end;
                        var prop = _.intersection(_.keys(entity), _.keys(restrictionKeywords));
                        if (prop.length === 1) {
                            var item = _.get(entity[prop[0]], '0');
                            var keyword = html ? surround(restrictionKeywords[prop[0]], restrictionClassName) : restrictionKeywords[prop[0]];
                            result += restriction + keyword + getManchesterValue(item, jsonld, html);
                        }
                    }
                }
                return result === '' ? id : result;
            }

            function getManchesterValue(item, jsonld, html = false) {
                if (_.has(item, '@value')) {
                    var literal, lang = '';
                    if (_.has(item, '@language')) {
                        literal = '"' + item['@value'] + '"';
                        lang = '@' + item['@language'];
                    } else {
                        var literal = _.get(item, '@type') === prefixes.xsd + 'string' ? '"' + item['@value'] + '"' : item['@value'];
                    }
                    return (html ? surround(literal, literalClassName) : literal) + lang;
                } else {
                    var value = _.get(item, '@id');
                    return om.isBlankNodeId(value) ? '(' + self.jsonldToManchester(value, jsonld, html) + ')' : $filter('splitIRI')(value).end;
                }
            }

            function surround(str, className) {
                return '<span class="' + className + '">' + str + '</span>';
            }
        }
})();
