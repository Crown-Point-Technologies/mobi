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
import { get } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { REGEX } from '../../../constants';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

interface TagConfig {
    title: string,
    iri: string,
    commitId: string,
    description?: string
}

/**
 * @class shapes-graph-editor.CreateTagModal
 * 
 * A component that creates content for a modal to create a tag for the ShapesGraphRecord. The form in the modal
 * contains inputs for the iri and title and a textarea for the description of the tag.
 */
@Component({
    selector: 'create-tag-modal',
    templateUrl: './createTagModal.component.html'
})
export class CreateTagModal implements OnInit {
    catalogId: string = get(this.cm.localCatalog, '@id', '');
    iriHasChanged = false;
    iriPattern = REGEX.IRI;
    error = '';

    createTagForm = this.fb.group({
        iri: ['', Validators.required],
        title: ['', Validators.required],
        description: ['']
    });

    constructor(private state: ShapesGraphStateService, private cm: CatalogManagerService,
                private fb: UntypedFormBuilder, private dialogRef: MatDialogRef<CreateTagModal>,
                private camelCase: CamelCasePipe) {}

    ngOnInit(): void {
        let iri = this.state.listItem.shapesGraphId;
        const endChar = iri.slice(-1);
        if (endChar !== '/' && endChar !== '#' && endChar !== ':') {
            iri += '/';
        }
        this.createTagForm.controls.iri.setValue(iri);
    }
    nameChanged(): void {
        if (!this.iriHasChanged) {
            const split = splitIRI(this.createTagForm.controls.iri.value);
            const iri = split.begin + split.then + this.camelCase.transform(this.createTagForm.controls.title.value, 
              'class');
            this.createTagForm.controls.iri.setValue(iri);
        }
    }
    createTag(): void {
        const tagConfig: TagConfig = {
            title: this.createTagForm.controls.title.value,
            iri: this.createTagForm.controls.iri.value,
            commitId: this.state.listItem.versionedRdfRecord.commitId,
            description: this.createTagForm.controls.description.value
        };
        this.cm.createRecordTag(this.state.listItem.versionedRdfRecord.recordId, this.catalogId, tagConfig).pipe(
            switchMap(tagId => this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, 
                undefined, this.state.listItem.versionedRdfRecord.commitId, tagId, 
                this.createTagForm.controls.title.value, true)
            )
        ).subscribe(() => this.dialogRef.close(true), error => {
            this.error = error;
        });
    }
}
