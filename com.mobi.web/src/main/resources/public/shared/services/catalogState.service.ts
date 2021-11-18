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
import { find, includes, get } from 'lodash';

catalogStateService.$inject = ['catalogManagerService', 'prefixes'];

/**
 * @ngdoc service
 * @name shared.service:catalogStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:prefixes
 *
 * @description
 * `catalogStateService` is a service which contains various variables to hold the state of the
 * {@link catalog.component:catalogPage} and utility functions to update those variables.
 */
function catalogStateService(catalogManagerService, prefixes) {
    var self = this;
    var cm = catalogManagerService;

    /**
     * @ngdoc property
     * @name totalRecordSize
     * @propertyOf shared.service:catalogStateService
     * @type {number}
     *
     * @description
     * `totalRecordSize` holds an integer for the total number of catalog Records in the latest query on the
     * {@link catalog.component:recordsView}.
     */
    self.totalRecordSize = 0;
    /**
     * @ngdoc property
     * @name currentRecordPage
     * @propertyOf shared.service:catalogStateService
     * @type {number}
     *
     * @description
     * `currentRecordPage` holds an 1 based index indicating which page of catalog Records should be displayed
     * in the {@link catalog.component:recordsView}.
     */
    self.currentRecordPage = 1;
    /**
     * @ngdoc property
     * @name recordLimit
     * @propertyOf shared.service:catalogStateService
     * @type {number}
     *
     * @description
     * `recordLimit` holds an integer representing the maximum number of catalog Records to be shown in a page
     * in the {@link catalog.component:recordsView}.
     */
    self.recordLimit = 10;
    /**
     * @ngdoc property
     * @name recordSortOption
     * @propertyOf shared.service:catalogStateService
     * @type {Object}
     *
     * @description
     * `recordSortOption` holds one of the options from the `sortOptions` in the
     * {@link shared.service:catalogManagerService} to be used when sorting the catalog Records in the
     * {@link catalog.component:recordsView}.
     */
    self.recordSortOption = undefined;
    /**
     * @ngdoc property
     * @name recordFilterType
     * @propertyOf shared.service:catalogStateService
     * @type {string}
     *
     * @description
     * `recordFilterType` holds the IRI of a catalog Record type to be used to filter the results in the
     * {@link catalog.component:recordsView}.
     */
    self.recordFilterType = '';

    /**
     * @ngdoc property
     * @name keywordFilterList
     * @propertyOf shared.service:catalogStateService
     * @type {list}
     *
     * @description
     * `keywordFilterList` holds a list of keyword string values to be used to filter the results in the
     * {@link catalog.component:recordsView}.
     */
    self.keywordFilterList = [];

    /**
     * @ngdoc property
     * @name keywordSearchText
     * @propertyOf shared.service:catalogStateService
     * @type {string}
     *
     * @description
     * `keywordSearchText` holds a keyword search string
     * {@link catalog.component:recordsView}.
     */
    self.keywordSearchText = '';

    /**
     * @ngdoc property
     * @name recordSearchText
     * @propertyOf shared.service:catalogStateService
     * @type {string}
     *
     * @description
     * `recordSearchText` holds a search text to be used when retrieving catalog Records in the
     * {@link catalog.component:recordsView}.
     */
    self.recordSearchText = '';
    /**
     * @ngdoc property
     * @name selectedRecord
     * @propertyOf shared.service:catalogStateService
     * @type {Object}
     *
     * @description
     * `selectedRecord` holds the currently selected catalog Record object that is being viewed in the
     * {@link catalog.component:catalogPage}.
     */
    self.selectedRecord = undefined;
    /**
     * @ngdoc property
     * @name recordIcons
     * @propertyOf shared.service:catalogStateService
     * @type {Object}
     *
     * @description
     * `recordIcons` holds each recognized Record type as keys and values of Font Awesome class names to
     * represent the record types.
     */
    self.recordIcons = {
        [prefixes.ontologyEditor + 'OntologyRecord']: 'fa-sitemap',
        [prefixes.dataset + 'DatasetRecord']: 'fa-database',
        [prefixes.delim + 'MappingRecord']: 'fa-map',
        [prefixes.shapesGraphEditor + 'ShapesGraphRecord']: 'mat rule',
        default: 'fa-book'
    };

    /**
     * @ngdoc method
     * @name initialize
     * @methodOf shared.service:catalogStateService
     *
     * @description
     * Initializes state variables for the {@link catalog.component:catalogPage} using information retrieved
     * from {@link shared.service:catalogManagerService catalogManagerService}.
     */
    self.initialize = function() {
        self.initializeRecordSortOption();
    }
    /**
     * @ngdoc method
     * @name getRecordType
     * @methodOf shared.service:catalogStateService
     *
     * @description
     * Returns the type of the provided Record.
     *
     * @return {string} The type IRI of the record
     */
    self.getRecordType = function(record) {
        return find(Object.keys(self.recordIcons), type => includes(get(record, '@type', []), type)) || prefixes.catalog + 'Record';
    }
    /**
     * @ngdoc method
     * @name getRecordIcon
     * @methodOf shared.service:catalogStateService
     *
     * @description
     * Returns a Font Awesome icon class representing the type of the provided catalog Record object. If the
     * record is not a type that has a specific icon, a generic icon class is returned.
     * 
     * @return {string} A Font Awesome class string
     */
    self.getRecordIcon = function(record) {
        var type = self.getRecordType(record);
        return self.recordIcons[type === prefixes.catalog + 'Record' ? 'default' : type];
    }
    /**
     * @ngdoc method
     * @name reset
     * @methodOf shared.service:catalogStateService
     *
     * @description
     * Resets all state variables for the {@link catalog.component:catalogPage}.
     */
    self.reset = function() {
        self.totalRecordSize = 0;
        self.currentRecordPage = 1;
        self.recordFilterType = '';
        self.keywordFilterList = [];
        self.recordSearchText = '';
        self.initializeRecordSortOption();
        self.selectedRecord = undefined;
    }
    /**
     * @ngdoc method
     * @name initializeRecordSortOption
     * @methodOf shared.service:catalogStateService
     *
     * @description
     * Initializes the `recordSortOption` to a certain sort option from the
     * {@link shared.service:catalogManagerService catalogManagerService}.
     */
    self.initializeRecordSortOption = function() {
        self.recordSortOption = find(cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false});
    }
}

export default catalogStateService;
