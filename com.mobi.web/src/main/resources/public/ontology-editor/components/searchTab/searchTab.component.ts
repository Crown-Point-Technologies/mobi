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
import { forEach, isEmpty, omit } from 'lodash';

import './searchTab.component.scss';
import themingConfig from '../../../theming.config';

const template = require('./searchTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:searchTab
 *
 * @description
 * `searchTab` is a component that creates a page containing a form for searching for entities in the current
 * {@link shared.service:ontologyStateService selected ontology}. The display includes a search input,
 * a manual 'tree' of the results grouped by entity type, and a display of the matching properties on the
 * selected search result. The search input performs a case-insensitive search among the property values on
 * entities in the ontology. A search result item can be doubled clicked to open it in its appropriate tab
 * in the {@link ontology-editor.component:ontologyTab}.
 */
const searchTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: searchTabComponentCtrl
};

searchTabComponentCtrl.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'ontologyManagerService', 'httpService'];

function searchTabComponentCtrl(ontologyStateService, ontologyUtilsManagerService, ontologyManagerService, httpService) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.om = ontologyManagerService;

    dvm.$onInit = function() {
        dvm.os.listItem.editorTabStates.search.id = 'search-' + dvm.os.listItem.ontologyRecord.recordId;
    }
    dvm.onKeyup = function() {
        if (dvm.os.listItem.editorTabStates.search.searchText) {
            httpService.cancel(dvm.os.listItem.editorTabStates.search.id);
            dvm.unselectItem();
            var state = dvm.os.listItem.editorTabStates;
            dvm.om.getSearchResults(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.editorTabStates.search.searchText, dvm.os.listItem.editorTabStates.search.id)
                .then(results => {
                    state.search.errorMessage = '';
                    forEach(results, arr => {
                        arr.sort((iri1, iri2) => dvm.os.getEntityNameByIndex(iri1, dvm.os.listItem).localeCompare(dvm.os.getEntityNameByIndex(iri2, dvm.os.listItem)));
                    });
                    state.search.results = results;
                    state.search.infoMessage = !isEmpty(results) ? '' : 'There were no results for your search text.';
                    state.search.highlightText = state.search.searchText;
                }, errorMessage => {
                    state.search.errorMessage = errorMessage;
                    state.search.infoMessage = '';
                });
        } else {
            dvm.os.resetSearchTab();
        }
    }
    dvm.canGoTo = function() {
        return !!dvm.os.listItem.editorTabStates.search.entityIRI && !(dvm.om.isOntology(dvm.os.listItem.selected) && dvm.os.listItem.editorTabStates.search.entityIRI !== dvm.os.listItem.ontologyId);
    }
    dvm.goToIfYouCan = function(item) {
        if (dvm.canGoTo()) {
            dvm.os.goTo(item);
        }
    }
    dvm.selectItem = function(item) {
        dvm.os.selectItem(item, false)
            .then(() => {
                dvm.os.listItem.editorTabStates.search.selected = omit(angular.copy(dvm.os.listItem.selected), '@id', '@type', 'mobi');
            });
    }
    dvm.unselectItem = function() {
        dvm.os.unSelectItem();
        dvm.os.listItem.editorTabStates.search.selected = undefined;
    }
}

export default searchTabComponent;