/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import {Component, Input, OnChanges} from '@angular/core';
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {MatDialog} from "@angular/material/dialog";
import {TypesOverlayComponent} from "../types-overlay/types-overlay.component";
import {isBlankNodeId} from "../../../shared/utility";
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
// import module

@Component({
  selector: 'types-block',
  templateUrl: './types.component.html',
  styleUrls: ['./types.component.scss']
})
export class TypesComponent implements OnChanges {
  @Input() selected;
  typeValues = [];
  constructor(public os: OntologyStateService,
              private dialog: MatDialog, public om: OntologyManagerService,
              ) {}

  ngOnChanges(): void {
    if(this.os.listItem?.selected['@id']) {
      this.os.getEntity(this.os.listItem.selected['@id']).subscribe(data => {
        this.typeValues = this.extractTypes(data);
      });
    }
  }

  extractTypes(value: JSONLDObject[]): string[] {
    const types: string[] = [];

    for (const obj of value) {
      if (obj && typeof obj === 'object') {
        if (obj["http://purl.org/dc/terms/title"] !== undefined) {
          if (Array.isArray(obj["@type"])) {
            types.push(...obj["@type"]);
          }
        }
      }
    }

    return types;
  }

  openAddTypeOverlay(){
    this.dialog.open(TypesOverlayComponent).afterClosed().subscribe((result) => {
    });
  }

  showRemovePropertyOverlay(iri: any, index: number): void {
    let htmlValue = this.os.getBlankNodeValue(iri) || iri;
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();
    const deleteIRI = htmlValue ? htmlValue : iri;
    this.dialog.open(ConfirmModalComponent,{
      data: {
        content: `<p>Are you sure you want to remove:<br><strong>${deleteIRI}</strong> ?</p>`,
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        const payload:JSONLDObject = {
          '@id': this.os.listItem.selected['@id'],
          '@type':[iri]
        }
          this.os.addToDeletions(
              this.os.listItem.versionedRdfRecord.recordId,
              payload
          );
          this.os.saveCurrentChanges().subscribe();
      }
    });
  }

  protected readonly isBlankNodeId = isBlankNodeId;
}
