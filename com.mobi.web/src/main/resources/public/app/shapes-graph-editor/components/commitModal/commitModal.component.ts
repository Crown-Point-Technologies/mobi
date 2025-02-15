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
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { get } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { getPropertyId } from '../../../shared/utility';

/**
 * @class shapes-graph-editor.CommitModalComponent
 * 
 * A component that creates content for a modal to commit the changes to the ShapesGraphRecord. The form in the modal
 * contains a `textarea for the commit message.
 */
@Component({
    selector: 'commit-modal',
    templateUrl: './commitModal.component.html'
})
export class CommitModalComponent {

    errorMessage = '';
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    createCommitForm = this.fb.group({
        comment: ['', Validators.required]
    });

    constructor(private state: ShapesGraphStateService, private toast: ToastService, private cm: CatalogManagerService,
        private fb: UntypedFormBuilder, private dialogRef: MatDialogRef<CommitModalComponent>) {}

    commit(): void {
        this.cm.getRecordBranch(this.state.listItem.versionedRdfRecord.branchId, this.state.listItem.versionedRdfRecord.recordId, this.catalogId)
            .subscribe(branch => {
                this.state.listItem.upToDate = getPropertyId(branch, `${CATALOG}head`) === this.state.listItem.versionedRdfRecord.commitId;
                if (this.state.listItem.upToDate) {
                    this.createCommit(this.state.listItem.versionedRdfRecord.branchId);
                } else {
                    this.errorMessage = 'Cannot commit. Branch is behind HEAD. Please update.';
                }
            }, error => this.toast.createErrorToast(error));
    }
    createCommit(branchId: string): void {
        this.cm.createBranchCommit(branchId, this.state.listItem.versionedRdfRecord.recordId, this.catalogId,
            this.createCommitForm.controls.comment.value).pipe(
                switchMap(commitIri => this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, 
                        this.state.listItem.versionedRdfRecord.branchId, commitIri, undefined, undefined, true,
                        this.state.listItem.changesPageOpen)
                )
            ).subscribe(() => {
                this.toast.createSuccessToast('Successfully Committed Changes');
                this.dialogRef.close(true);
            }, error => {
                this.errorMessage = error;
            });
    }
}
