import { Component } from '@angular/core';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

/**
 * @class ontology-editor.MergeTabComponent
 *
 * `mergeTab` is a component that creates a contains for performing a direct merge between two branches in the
 * currently {@link shared.OntologyStateService#listItem selected ontology}. If there are no conflicts, a
 * {@link ontology-editor.MergeBlockComponent} is shown. If there are conflicts, a
 * {@link ontology-editor.ResolveConflictsFormComponent} is shown.
 */
@Component({
    selector: 'merge-tab',
    templateUrl: './mergeTab.component.html'
})
export class MergeTabComponent {
    error = '';
    
    constructor(public os: OntologyStateService, private _toast: ToastService) {}

    submitConflictMerge(): void {
        this.os.merge()
            .subscribe(() => {
                this.os.resetStateTabs();
                this._toast.createSuccessToast('Your merge was successful with resolutions.');
                this.os.cancelMerge();
            }, error => this.error = error);
    }
    cancelMerge(): void {
        this.os.cancelMerge();
    }
}
