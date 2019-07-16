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
import { filter, map, includes } from 'lodash';

const template = require('./runMappingDatasetOverlay.component.html');

/**
 * @ngdoc component
 * @name mapper.component:runMappingDatasetOverlay
 * @requires shared.service:mapperStateService
 * @requires shared.service:delimitedManagerService
 * @requires shared.service:datasetManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `runMappingDatasetOverlay` is a component that creates content for a modal that contains a configuration
 * settings for running the currently selected {@link shared.service:mapperStateService#mapping mapping}
 * against the uploaded {@link shared.service:delimitedManagerService#dataRows delimited data}.
 * This includes a `ui-select` to determine which dataset to upload the results of a mapping into. Meant to be
 * used in conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const runMappingDatasetOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: runMappingDatasetOverlayComponentCtrl,
};

runMappingDatasetOverlayComponentCtrl.$inject = ['mapperStateService', 'delimitedManagerService', 'datasetManagerService', 'utilService'];

function runMappingDatasetOverlayComponentCtrl(mapperStateService, delimitedManagerService, datasetManagerService, utilService) {
    var dvm = this;
    var dam = datasetManagerService;
    var state = mapperStateService;
    var dm = delimitedManagerService;
    var util = utilService;
    dvm.errorMessage = '';
    dvm.datasetRecordIRI = '';
    dvm.datasetRecords = [];
    dvm.selectRecords = [];

    dvm.$onInit = function() {
        dam.getDatasetRecords().then(response => {
            dvm.datasetRecords = map(response.data, arr => {
                var record = angular.copy(dam.getRecordFromArray(arr));
                record.title = util.getDctermsValue(record, 'title');
                return record;
            });
        }, onError);
    }
    dvm.setRecords = function(searchText) {
        var tempRecords = angular.copy(dvm.datasetRecords);
        if (searchText) {
            tempRecords = filter(tempRecords, record => includes(record.title.toLowerCase(), searchText.toLowerCase()));
        }
        tempRecords.sort((record1, record2) => record1.title.localeCompare(record2.title));
        dvm.selectRecords = tempRecords.slice(0, 100);
    }
    dvm.run = function() {
        if (state.editMapping && state.isMappingChanged()) {
            state.saveMapping().then(runMapping, onError);
        } else {
            runMapping(state.mapping.record.id);
        }
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function onError(errorMessage) {
        dvm.errorMessage = errorMessage;
    }
    function runMapping(id) {
        state.mapping.record.id = id;
        dm.mapAndUpload(id, dvm.datasetRecordIRI).then(reset, onError);
    }
    function reset() {
        state.step = state.selectMappingStep;
        state.initialize();
        state.resetEdit();
        dm.reset();
        util.createSuccessToast('Successfully ran mapping');
        dvm.close();
    }
}

export default runMappingDatasetOverlayComponent;