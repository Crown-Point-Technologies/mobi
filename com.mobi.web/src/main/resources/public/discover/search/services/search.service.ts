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
import * as angular from 'angular';
import { forEach, initial, flatten, find, map, get, concat, assign, forOwn, has, set, some, last } from 'lodash';

searchService.$inject = ['$q', 'discoverStateService', 'httpService', 'sparqlManagerService', 'sparqljs', 'prefixes', 'datasetManagerService', 'ontologyManagerService', 'utilService'];

/**
 * @ngdoc service
 * @name search.service:searchService
 * @requires shared.service:discoverStateService
 * @requires shared.service:httpService
 * @requires shared.service:sparqlManager
 * @requires shared.service:prefixes
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `searchService` is a service that provides methods to create search query strings
 * and submit them to the {@link shared.service:sparqlManagerService SPARQL query endpoints}.
 */
function searchService($q, discoverStateService, httpService, sparqlManagerService, sparqljs, prefixes, datasetManagerService, ontologyManagerService, utilService) {
    var self = this;
    var ds = discoverStateService;
    var sm = sparqlManagerService;
    var dm = datasetManagerService;
    var om = ontologyManagerService;
    var util = utilService;
    var index = 0;
    var variables: any = {};

    /**
     * @ngdoc method
     * @name getPropertiesForDataset
     * @methodOf search.service:searchService
     *
     * @description
     * Gets all of the data properties for all ontologies associated with the identified dataset.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
     * @return {Promise} A Promise that resolves with the list of data properties or rejects with an error message.
     */
    self.getPropertiesForDataset = function(datasetRecordIRI) {
        var datasetArray = find(dm.datasetRecords, arr => some(arr, {'@id': datasetRecordIRI}));
        return $q.all(flatten(map(dm.getOntologyIdentifiers(datasetArray), identifier => {
            var recordId = util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord');
            var branchId = util.getPropertyId(identifier, prefixes.dataset + 'linksToBranch');
            var commitId = util.getPropertyId(identifier, prefixes.dataset + 'linksToCommit');
            return [om.getDataProperties(recordId, branchId, commitId), om.getObjProperties(recordId, branchId, commitId)];
        }))).then(response => flatten(response));
    }
    /**
     * @ngdoc method
     * @name submitSearch
     * @methodOf search.service:searchService
     *
     * @description
     * Runs a SPARQL query made using the provided keywords, types, and boolean operators against the
     * repository and returns the SPARQL spec JSON results.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
     * @param {Object} queryConfig A configuration object for the query string
     * @param {string[]} queryConfig.keywords An array of keywords to search for
     * @param {boolean} queryConfig.isOrKeywords Whether or not the keyword search results should be combined with OR or not
     * @param {string[]} queryConfig.types An array of types to search for
     * @param {boolean} queryConfig.isOrTypes Whether or not the type search results should be combined with OR or not
     * @return {Promise} A Promise that resolves with the query results or rejects with an error message.
     */
    self.submitSearch = function(datasetRecordIRI, queryConfig) {
        httpService.cancel(ds.search.targetedId);
        return sm.query(self.createQueryString(queryConfig), datasetRecordIRI, ds.search.targetedId);
    }
    /**
     * @ngdoc method
     * @name createQueryString
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a SPARQL query that selects all subjects, predicates, and objects that match
     * multiple keywords searches and/or multiple type declarations combined either using
     * boolean operator AND or OR.
     *
     * @param {Object} queryConfig A configuration object for the query string
     * @param {string[]} [queryConfig.keywords=[]] An array of keywords to search for
     * @param {boolean} [queryConfig.isOrKeywords=false] Whether or not the keyword search results should be combined with OR or not
     * @param {string[]} [queryConfig.types=[]] An array of types to search for
     * @param {boolean} [queryConfig.isOrTypes=false] Whether or not the type search results should be combined with OR or not
     * @param {Object[]} queryConfig.filters An array of property filters to apply to the query
     * @param {Object} queryConfig.variables The object that will be set by this function to link the query variables with their labels
     * @return {string} A SPARQL query string
     */
    self.createQueryString = function(queryConfig) {
        index = 0;
        variables = {};
        var query: any = {
            type: 'query',
            prefixes: {},
            queryType: 'SELECT',
            group: [{ expression: '?Entity' }],
            distinct: true,
            where: []
        };
        if (get(queryConfig, 'keywords', []).length) {
            if (get(queryConfig, 'isOrKeywords', false)) {
                let obj = {type: 'union', patterns: map(queryConfig.keywords, keyword => createKeywordQuery(keyword))};
                query.where.push(obj);
            } else {
                query.where = map(queryConfig.keywords, keyword => createKeywordQuery(keyword));
            }
        }
        if (get(queryConfig, 'types', []).length) {
            if (get(queryConfig, 'isOrTypes', false)) {
                let obj = {type: 'union', patterns: map(queryConfig.types, type => createTypeQuery(type))};
                query.where.push(obj);
            } else {
                query.where = concat(query.where, map(queryConfig.types, type => createTypeQuery(type)));
            }
        }
        if (get(queryConfig, 'filters', []).length) {
            query.where = concat(query.where, map(queryConfig.filters, getQueryPart));
        }
        //@todo test this.
        let mapper: any  = map(Object.keys(variables), createVariableExpression);
       // query.variables = concat(['?Entity'], ma );
       query.variables = concat(['?Entity'], mapper);
        queryConfig.variables = assign({Entity: 'Entity'}, variables);
        var generator = new sparqljs.Generator();
        return generator.stringify(query);
    }
    /**
     * @ngdoc method
     * @name createExistenceQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {string} variable The variable name to use in the query
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createExistenceQuery = function(predicate, label, pathDetails) {
        var existencePattern = createPattern(pathDetails.variable, predicate, getNextVariable(label));
        return {
            type: 'group',
            patterns: concat(pathDetails.patterns, [existencePattern])
        };
    }
    /**
     * @ngdoc method
     * @name createContainsQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate and contains the provided keyword.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {string} keyword The keyword to filter results by
     * @param {string} variable The variable name to use in the query
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createContainsQuery = function(predicate, keyword, label, pathDetails) {
        var variable = getNextVariable(label);
        var containsPattern = createPattern(pathDetails.variable, predicate, variable);
        return {
            type: 'group',
            patterns: concat(pathDetails.patterns, [containsPattern, createKeywordFilter(keyword, variable)])
        };
    }
    /**
     * @ngdoc method
     * @name createExactQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate and exactly matches the provided keyword.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {string} keyword The keyword to filter results by
     * @param {string} range The range of the keyword
     * @param {string} variable The variable name to use in the query
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createExactQuery = function(predicate, keyword, range, label, pathDetails) {
        var variable = getNextVariable(label);
        var exactPattern = createPattern(pathDetails.variable, predicate, variable);
        var exactFilter = createFilter({
            type: 'operation',
            operator: '=',
            args: [variable, '"' + keyword + '"^^' + range]
        });
        return {
            type: 'group',
            patterns: concat(pathDetails.patterns, [exactPattern, exactFilter])
        };
    }
    /**
     * @ngdoc method
     * @name createRegexQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate and matches the provided regex.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {string} regex The regex to filter results by
     * @param {string} variable The variable name to use in the query
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createRegexQuery = function(predicate, regex, label, pathDetails) {
        var variable = getNextVariable(label);
        var regexPattern = createPattern(pathDetails.variable, predicate, variable);
        var regexFilter = createFilter({
            type: 'operation',
            operator: 'regex',
            args: [variable, '\"' + regex.toString() + '\"']
        });
        return {
            type: 'group',
            patterns: concat(pathDetails.patterns, [regexPattern, regexFilter])
        };
    }
    /**
     * @ngdoc method
     * @name createRangeQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate and are within the configured range.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {Object} predRange The predicate's range
     * @param {Object} rangeConfig The range configuration
     * @param {string} rangeConfig.lessThan The value that the result must be less than
     * @param {string} rangeConfig.lessThanOrEqualTo The value that the result must be less than or equal to
     * @param {string} rangeConfig.greaterThan The value that the result must be greater than
     * @param {string} rangeConfig.greaterThanOrEqualTo The value that the result must be greater than or equal to
     * @param {string} variable The variable name to use in the query
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createRangeQuery = function(predicate, predRange, rangeConfig, label, pathDetails) {
        var variable = getNextVariable(label);
        var config = angular.copy(rangeConfig);
        var rangePattern = createPattern(pathDetails.variable, predicate, variable);
        var patterns = concat(pathDetails.patterns, [rangePattern]);
        if (util.getInputType(predRange) === 'datetime-local') {
            forOwn(config, (value, key) => {
                config[key] = JSON.stringify(value) + '^^<' + prefixes.xsd + 'dateTime>';
            });
        }
        if (has(config, 'lessThan')) {
            patterns.push(createFilter(variable + ' < ' + config.lessThan));
        }
        if (has(config, 'lessThanOrEqualTo')) {
            patterns.push(createFilter(variable + ' <= ' + config.lessThanOrEqualTo));
        }
        if (has(config, 'greaterThan')) {
            patterns.push(createFilter(variable + ' > ' + config.greaterThan));
        }
        if (has(config, 'greaterThanOrEqualTo')) {
            patterns.push(createFilter(variable + ' >= ' + config.greaterThanOrEqualTo));
        }
        return { type: 'group', patterns };
    }
    /**
     * @ngdoc method
     * @name createExactQuery
     * @methodOf search.service:searchService
     *
     * @description
     * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
     * for entities that have the provided predicate and exactly matches the provided boolean value.
     *
     * @param {string} predicate The predicate's existence which is being searched for
     * @param {boolean} value The value which is being searched for
     * @param {string} label The label to identify this variable
     * @param {Object} pathDetails The details associated with the property path
     * @param {string} pathDetails.variable The variable name to use for the booleanPattern
     * @param {Object[]} pathDetails.patterns The list of patterns needed for the query
     * @return {Object} A part of a SPARQL query object
     */
    self.createBooleanQuery = function(predicate, value, label, pathDetails) {
        var variable = getNextVariable(label);
        var values = value ? [true, 1] : [false, 0];
        var booleanPattern = createPattern(pathDetails.variable, predicate, variable);
        var booleanFilter = createFilter({
            type: 'operation',
            operator: 'in',
            args: [variable, map(values, value => '"' + value + '"^^' + prefixes.xsd + 'boolean')]
        });
        return {
            type: 'group',
            patterns: concat(pathDetails.patterns, [booleanPattern, booleanFilter])
        };
    }

    function createKeywordQuery(keyword) {
        var variable = '?Keyword';
        variables.Keywords = 'Keywords';
        return {
            type: 'group',
            patterns: [createPattern('?Entity', '?p', variable), createKeywordFilter(keyword, variable)]
        };
    }

    function createTypeQuery(item) {
        var variable = '?Type';
        variables.Types = 'Types';
        var typePattern = createPattern('?Entity', prefixes.rdf + 'type', item.classIRI);
        return {
            type: 'group',
            patterns: [typePattern, createPattern('?Entity', prefixes.rdf + 'type', variable)]
        };
    }

    function createKeywordFilter(keyword, variable) {
        return createFilter({
            type: 'operation',
            operator: 'contains',
            args: [{
                type: 'operation',
                operator: 'lcase',
                args: [variable]
            }, {
                type: 'operation',
                operator: 'lcase',
                args: ['\"' + keyword + '\"']
            }]
        });
    }

    function createPattern(subject, predicate, object) {
        return {
            type: 'bgp',
            triples: [{ subject, predicate, object }]
        };
    }

    function createFilter(expression) {
        return { type: 'filter', expression };
    }

    function createVariableExpression(variable) {
        var updated = '?' + variable.slice(0, -1);
        return {
            expression: {
                expression: updated,
                type: 'aggregate',
                aggregation: 'group_concat',
                distinct: true,
                separator: '<br>'
            },
            variable: updated + 's'
        };
    }

    function createBindOperation(value, variable) {
        return {
            type: 'operation',
            operator: 'bind',
            args: [{
                type: 'operation',
                operator: 'as',
                args: [value, variable]
            }]
        };
    }

    function getNextVariable(label = undefined) {
        var variable = 'var' + index++;
        if (label) {
            set(variables, variable + 's', label);
        }
        return '?' + variable;
    }

    function getQueryPart(filter) {
        var lastEl: any = last(filter.path);
        var predicate = lastEl.predicate;
        var range = lastEl.range;
        var pathDetails = createPathDetails(filter.path);
        switch(filter.type) {
            case 'Boolean':
                return self.createBooleanQuery(predicate, filter.boolean, filter.title, pathDetails);
            case 'Contains':
                return self.createContainsQuery(predicate, filter.value, filter.title, pathDetails);
            case 'Exact':
                return self.createExactQuery(predicate, filter.value, range, filter.title, pathDetails);
            case 'Existence':
            case undefined:
                return self.createExistenceQuery(predicate, filter.title, pathDetails);
            case 'Greater than':
                return self.createRangeQuery(predicate, range, {greaterThan: filter.value}, filter.title, pathDetails);
            case 'Greater than or equal to':
                return self.createRangeQuery(predicate, range, {greaterThanOrEqualTo: filter.value}, filter.title, pathDetails);
            case 'Less than':
                return self.createRangeQuery(predicate, range, {lessThan: filter.value}, filter.title, pathDetails);
            case 'Less than or equal to':
                return self.createRangeQuery(predicate, range, {lessThanOrEqualTo: filter.value}, filter.title, pathDetails);
            case 'Range':
                return self.createRangeQuery(predicate, range, {
                    greaterThanOrEqualTo: filter.begin,
                    lessThanOrEqualTo: filter.end
                }, filter.title, pathDetails);
            case 'Regex':
                return self.createRegexQuery(predicate, filter.regex, filter.title, pathDetails);
        }
    }

    function createPathDetails(path) {
        var start = initial(path);
        var variable = '?Entity';
        var patterns = [];
        forEach(start, (part:any) => {
            let oldVariable = variable;
            variable = getNextVariable();
            patterns.push(createPattern(oldVariable, part.predicate, variable));
            patterns.push(createPattern(variable, prefixes.rdf + 'type', part.range));
        });
        return {variable, patterns};
    }
}

export default searchService;