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

const template = require('./downloadMappingOverlay.component.html');

/**
 * @ngdoc component
 * @name mapper.component:downloadMappingOverlay
 * @requires shared.service:mappingManagerService
 * @requires shared.service:mapperStateService
 *
 * @description
 * `downloadMappingOverlay` is a component that content for a modal to download the current
 * {@link shared.service:mapperStateService#mapping mapping} in a variety of different formats using a
 * {@link mapper.component:mapperSerializationSelect mapperSerializationSelect}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const downloadMappingOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: downloadMappingOverlayComponentCtrl,
};

downloadMappingOverlayComponentCtrl.$inject = ['mappingManagerService', 'mapperStateService'];

function downloadMappingOverlayComponentCtrl(mappingManagerService, mapperStateService) {
    var dvm = this;
    dvm.state = mapperStateService;
    dvm.mm = mappingManagerService;
    dvm.downloadFormat = 'turtle';

    dvm.cancel = function() {
        dvm.dismiss();
    }
    dvm.download = function() {
        dvm.mm.downloadMapping(dvm.state.mapping.record.id, dvm.downloadFormat);
        dvm.close();
    }
}

export default downloadMappingOverlayComponent;