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

const template = require('./customLabel.component.html');

/**
 * @ngdoc component
 * @name shared.component:customLabel
 *
 * @description
 * `customLabel` is a component which creates a label element with transcluded text and
 * optional musted text within angle brackets. It is meant to be used for labeling a field
 * that involves an IRI in the muted text. The label element will be styled with the Bootstrap
 * 'control-label' class.
 *
 * @param {string} [mutedText=''] text to be displayed as muted within angle brackets after the
 * transcluded content.
 */
const customLabelComponent = {
    template,
    transclude: true,
    bindings: {
        mutedText: '<'
    },
    controllerAs: 'dvm',
    controller: customLabelComponentCtrl
}

function customLabelComponentCtrl() {}

export default customLabelComponent;