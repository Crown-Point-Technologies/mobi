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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { RdfUpload } from '../../../shared/models/rdfUpload.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RESTError } from '../../../shared/models/RESTError.interface';

/**
 * @class shapes-graph-editor.NewShapesGraphRecordModalComponent
 * 
 * A component that creates content for a modal to create a new ShapesGraphRecord.
 */
@Component({
    selector: 'new-shapes-graph-record-modal',
    templateUrl: './newShapesGraphRecordModal.component.html',
    styleUrls: ['./newShapesGraphRecordModal.component.scss']
})
export class NewShapesGraphRecordModalComponent {
    error: RESTError;
    createRecordForm = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        keywords: this.fb.array([])
    });
    selectedFile: File;
    // Keyword chips
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    constructor(private dialogRef: MatDialogRef<NewShapesGraphRecordModalComponent>, private fb: UntypedFormBuilder,
                private state: ShapesGraphStateService) {}

    create(): void {
        this.error = undefined;
        const rdfUpload: RdfUpload = {
            title: this.createRecordForm.controls.title.value,
            description: this.createRecordForm.controls.description.value,
            keywords: this.createRecordForm.controls.keywords.value,
            file: this.selectedFile
        };
        this.state.uploadShapesGraph(rdfUpload).subscribe(
            () => this.dialogRef.close(true),
            error => {
                if (typeof error === 'string') {
                    this.error = {
                        errorMessage: error,
                        error: '',
                        errorDetails: []
                    };
                } else {
                    this.error = error;
                }
            }
        );
    }
    add(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        const input = event.input;

        if (value && this.keywordControls.value.indexOf(value) < 0) {
            this.keywordControls.push(this.fb.control(value));
        }

        if (input) {
            input.value = '';
        }
    }
    remove(keyword: string): void {
        const index = this.keywordControls.value.indexOf(keyword);
        if (index >= 0) {
            this.keywordControls.removeAt(index);
        }
    }

    get keywordControls(): UntypedFormArray {
        return this.createRecordForm.controls.keywords as UntypedFormArray;
    }
}
