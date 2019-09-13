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
import { get, includes, map, filter, find, concat } from 'lodash';

import './datasetsList.component.scss';

const template = require('./datasetsList.component.html');

/**
 * @ngdoc component
 * @name datasets.component:datasetsList
 * @requires shared.service:datasetStateService
 * @requires shared.service:datasetManagerService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 * @requires shared.service:modalService
 *
 * @description
 * `datasetsList` is a component which creates a Bootstrap row containing a {@link shared.component:block block}
 * with a {@link shared.component:paging paginated} list of
 * {@link shared.service:datasetStateService Dataset Records} and
 * {@link shared.component:confirmModal confirmModal}s for deleting and clearing
 * datasets. Each dataset only displays its title, dataset IRI, and a portion of its description until it is
 * opened. Only one dataset can be open at a time.
 */
const datasetsListComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: datasetsListComponentCtrl
};

datasetsListComponentCtrl.$inject = ['$q', 'datasetManagerService', 'datasetStateService', 'catalogManagerService', 'utilService', 'prefixes', 'modalService'];

function datasetsListComponentCtrl($q, datasetManagerService, datasetStateService, catalogManagerService, utilService, prefixes, modalService) {
    var dvm = this;
    var dm = datasetManagerService;
    var cm = catalogManagerService;
    var cachedOntologyRecords = [];
    dvm.state = datasetStateService;
    dvm.util = utilService;
    dvm.prefixes = prefixes;
    dvm.cachedOntologyIds = [];

    dvm.$onInit = function() {
        dvm.catalogId = get(cm.localCatalog, '@id', '');
        dvm.currentPage = dvm.state.paginationConfig.pageIndex + 1;
    }
    dvm.getIdentifiedOntologyIds = function(dataset) {
        return map(dataset.identifiers, identifier => identifier[prefixes.dataset + 'linksToRecord'][0]['@id']);
    }
    dvm.getOntologyTitle = function(id) {
        return dvm.util.getDctermsValue(find(cachedOntologyRecords, {'@id': id}), 'title');
    }
    dvm.clickDataset = function(dataset) {
        if (dvm.state.openedDatasetId === dataset.record['@id']) {
            dvm.state.selectedDataset = undefined;
            dvm.state.openedDatasetId = '';
        } else {
            dvm.state.selectedDataset = dataset;
            dvm.state.openedDatasetId = dataset.record['@id'];
            var toRetrieve = filter(dvm.getIdentifiedOntologyIds(dataset), id => !includes(dvm.cachedOntologyIds, id));
            $q.all(map(toRetrieve, id => cm.getRecord(id, dvm.catalogId)))
                .then(responses => {
                    dvm.cachedOntologyIds = concat(dvm.cachedOntologyIds, map(responses, '@id'));
                    cachedOntologyRecords = concat(cachedOntologyRecords, responses);
                }, () => dvm.errorMessage = 'Unable to load all Dataset details.');
        }
    }
    dvm.getPage = function(page) {
        dvm.currentPage = page;
        dvm.state.paginationConfig.pageIndex = dvm.currentPage - 1;
        dvm.state.setResults();
    }
    dvm.delete = function(dataset) {
        dm.deleteDatasetRecord(dataset.record['@id'])
            .then(() => {
                dvm.util.createSuccessToast('Dataset successfully deleted');
                if (dvm.state.results.length === 1 && dvm.state.paginationConfig.pageIndex > 0) {
                    dvm.state.paginationConfig.pageIndex -= 1;
                }
                dvm.state.setResults();
                dvm.state.submittedSearch = !!dvm.state.paginationConfig.searchText;
            }, dvm.util.createErrorToast);
    }
    dvm.clear = function(dataset) {
        dm.clearDatasetRecord(dataset.record['@id'])
            .then(() => {
                dvm.util.createSuccessToast('Dataset successfully cleared');
            }, dvm.util.createErrorToast);
    }
    dvm.showUploadData = function(dataset) {
        dvm.state.selectedDataset = dataset;
        modalService.openModal('uploadDataOverlay');
    }
    dvm.showEdit = function(dataset) {
        dvm.state.selectedDataset = dataset;
        modalService.openModal('editDatasetOverlay');
    }
    dvm.showClear = function(dataset) {
        modalService.openConfirmModal('<p>Are you sure that you want to clear <strong>' + dvm.util.getDctermsValue(dataset.record, 'title') + '</strong>?</p>', () => dvm.clear(dataset));
    }
    dvm.showDelete = function(dataset) {
        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.util.getDctermsValue(dataset.record, 'title') + '</strong>?</p>', () => dvm.delete(dataset));
    }
}

export default datasetsListComponent;