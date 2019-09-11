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
import { map, filter, get, sortBy, noop, remove, difference, includes, forEach, concat } from 'lodash';

import './editDatasetOverlay.component.scss';

const template = require('./editDatasetOverlay.component.html');

/**
 * @ngdoc component
 * @name datasets.component:editDatasetOverlay
 * @requires shared.service:datasetStateService
 * @requires shared.service:datasetManagerService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `editDatasetOverlay` is a component that creates content for a modal with a form containing fields for
 * editing an existing Dataset Record. The form contains fields for the title, description,
 * {@link shared.component:keywordSelect keywords}, and
 * {@link datasets.component:datasetsOntologyPicker ontologies to be linked} to the Dataset
 * Record. Meant to be used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const editDatasetOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: editDatasetOverlayComponentCtrl
};

editDatasetOverlayComponentCtrl.$inject = ['$q', 'datasetStateService', 'datasetManagerService', 'catalogManagerService', 'utilService', 'prefixes'];

function editDatasetOverlayComponentCtrl($q, datasetStateService, datasetManagerService, catalogManagerService, utilService, prefixes) {
    var dvm = this;
    var cm = catalogManagerService;
    var dm = datasetManagerService;
    var ds = datasetStateService;
    var catalogId = '';
    dvm.util = utilService;
    dvm.error = '';
    dvm.recordConfig = {};
    dvm.keywords = [];
    dvm.selectedOntologies = [];

    dvm.$onInit = function() {
        catalogId = get(cm.localCatalog, '@id');
        dvm.recordConfig = {
            datasetIRI: dvm.util.getPropertyId(ds.selectedDataset.record, prefixes.dataset + 'dataset'),
            repositoryId: dvm.util.getPropertyValue(ds.selectedDataset.record, prefixes.dataset + 'repository'),
            title: dvm.util.getDctermsValue(ds.selectedDataset.record, 'title'),
            description: dvm.util.getDctermsValue(ds.selectedDataset.record, 'description')
        };
        dvm.keywords = map(ds.selectedDataset.record[prefixes.catalog + 'keyword'], '@value');
        dvm.keywords.sort();
        var selectedOntologies = map(ds.selectedDataset.identifiers, identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));
        $q.all(map(selectedOntologies, id => cm.getRecord(id, catalogId)))
            .then(responses => filter(responses, r => !!r), () => onError('A selected ontology could not be found'))
            .then(filteredList => {
                dvm.selectedOntologies = sortBy(map(filteredList, record => ({
                    recordId: record['@id'],
                    ontologyIRI: dvm.getOntologyIRI(record),
                    title: dvm.util.getDctermsValue(record, 'title'),
                    selected: true
                })), 'title');
            })
            .catch(noop);
    }

    dvm.selectOntology = function(ontology) {
        dvm.selectedOntologies.push(ontology);
        dvm.selectedOntologies = sortBy(dvm.selectedOntologies, 'title');
    }
    dvm.unselectOntology = function(ontology) {
        remove(dvm.selectedOntologies, {recordId: ontology.recordId});
    }
    dvm.getOntologyIRI = function(record) {
        return dvm.util.getPropertyId(record, prefixes.ontologyEditor + 'ontologyIRI');
    }
    dvm.update = function() {
        var newRecord = angular.copy(ds.selectedDataset.record);

        newRecord[prefixes.dcterms + 'title'] = [];
        newRecord[prefixes.dcterms + 'description'] = [];
        newRecord[prefixes.catalog + 'keyword'] = [];

        dvm.util.setDctermsValue(newRecord, 'title', dvm.recordConfig.title.trim());
        dvm.util.setDctermsValue(newRecord, 'description', dvm.recordConfig.description.trim());
        forEach(dvm.keywords, kw => dvm.util.setPropertyValue(newRecord, prefixes.catalog + 'keyword', kw.trim()));

        var curOntologies = map(dvm.selectedOntologies, 'recordId');
        var oldOntologies = map(ds.selectedDataset.identifiers, identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));

        var newIdentifiers = angular.copy(ds.selectedDataset.identifiers);

        var added = difference(curOntologies, oldOntologies);
        var deleted = remove(newIdentifiers, identifier => !includes(curOntologies, dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord')));

        forEach(deleted, identifier => {
            remove(newRecord[prefixes.dataset + 'ontology'], {'@id': identifier['@id']});
        });

        if (added.length > 0) {
            $q.all(map(added, recordId => cm.getRecordMasterBranch(recordId, catalogId)))
                    .then(responses => {
                        forEach(responses, (branch, idx) => {
                            var id = dvm.util.getSkolemizedIRI();
                            newIdentifiers.push(createBlankNode(id, added[idx], branch['@id'], dvm.util.getPropertyId(branch, prefixes.catalog + 'head')));
                            dvm.util.setPropertyId(newRecord, prefixes.dataset + 'ontology', id);
                        });
                        triggerUpdate(newRecord, newIdentifiers);
                    }, onError);
        } else {
            triggerUpdate(newRecord, newIdentifiers);
        }
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function onError(errorMessage) {
        dvm.error = errorMessage;
    }
    function createBlankNode(id, recordId, branchId, commitId) {
        return {
                '@id': id,
                [prefixes.dataset + 'linksToRecord']: [{ '@id': recordId }],
                [prefixes.dataset + 'linksToBranch']: [{ '@id': branchId }],
                [prefixes.dataset + 'linksToCommit']: [{ '@id': commitId }]
            }
    }
    function triggerUpdate(newRecord, newIdentifiers) {
        var jsonld = concat(newIdentifiers, newRecord);

        // Send unparsed object to the update endpoint.
        dm.updateDatasetRecord(newRecord['@id'], catalogId, jsonld, dvm.util.getDctermsValue(newRecord, 'title')).then(() => {
            dvm.util.createSuccessToast('Dataset successfully updated');
            ds.selectedDataset.identifiers = newIdentifiers;
            ds.selectedDataset.record = newRecord;
            ds.setResults();
            dvm.close();
        }, onError);
    }
}

export default editDatasetOverlayComponent;