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

const template = require('./commitDifferenceTabset.component.html');

/**
 * @ngdoc component
 * @name shared.component:commitDifferenceTabset
 *
 * @description
 * `commitDifferenceTabset` is a directive which creates a div containing a {@link shared.component:tabset} with
 * tabs for the {@link shared.component:commitChangesDisplay changes} and
 * {@link shared.component:commitHistoryTable commits} between two branches.
 *
 * @param {string} recordId The IRI of the VersionedRDFRecord that the Commits belong to
 * @param {Object} sourceBranch The JSON-LD of the source branch of the difference
 * @param {string} targetBranchId The IRI of the target branch of the difference
 * @param {Object} difference The object representing the difference between the two Commits
 * @param {Function} entityNameFunc An optional function to pass to `commitChangesDisplay` to control the display of
 * each entity's name
 */
const commitDifferenceTabsetComponent = {
    template,
    bindings: {
        branchTitle: '<',
        commitId: '<',
        targetId: '<',
        difference: '<',
        entityNameFunc: '<?'
    },
    controllerAs: 'dvm',
    controller: commitDifferenceTabsetComponentCtrl
};

function commitDifferenceTabsetComponentCtrl() {
    var dvm = this;
    dvm.tabs = {
        changes: true,
        commits: false
    };
}

export default commitDifferenceTabsetComponent;