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
import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {MatDialog} from "@angular/material/dialog";
import {SameAsOverlayComponent} from "../same-as-overlay/same-as-overlay.component";
import {has, sortBy} from "lodash";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {JSONLDId} from "../../../shared/models/JSONLDId.interface";
import {createJson, isBlankNodeId} from "../../../shared/utility";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {OWL} from "../../../prefixes";

@Component({
  selector: 'same-as-block',
  templateUrl: './same-as-block.component.html',
  styleUrls: ['./same-as-block.component.scss']
})
export class SameAsBlockComponent implements OnChanges {
  @Input() selected;
  property = [];

  constructor(public os: OntologyStateService,
              private dialog: MatDialog) {}

  ngOnChanges(): void {
    this.updatePropertiesFiltered();
  }
  updatePropertiesFiltered(): void{
    this.os.getEntity(this.os.listItem.selected['@id']).subscribe(data =>{
      this.property = this.extractSameAsIds(data);
    });
  }

  extractSameAsIds(selectedProperty:JSONLDObject[]):string[]{
    const sameAsIds:string[] = [];

    selectedProperty.forEach((item)=>{
      const sameAsProp = item[`${OWL}sameAs`];
      if(sameAsProp){
        sameAsProp.forEach((sameAsItem) =>{
          sameAsIds.push(sameAsItem['@id']);
        });
      }
    });
    return sameAsIds;
  }
  openAddSameAsOverlay(){
    this.dialog.open(SameAsOverlayComponent).afterClosed().subscribe(() => {
      this.updatePropertiesFiltered();
    });
  }

  showRemovePropertyOverlay(iri: string, index: number): void {
    this.dialog.open(ConfirmModalComponent,{
      data: {
        content: `<p>Are you sure you want to remove:<br><strong>${iri}</strong> ?</p>`,
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        const select = `${OWL}sameAs`;
        const value = iri;
        const valueObj = {'@id': value};

        if (value) {
          this.os.addToDeletions(
              this.os.listItem.versionedRdfRecord.recordId,
              createJson(this.os.listItem.selected['@id'], select, valueObj)
          );
          this.os.saveCurrentChanges().subscribe();
          this.updatePropertiesFiltered();
        }
      }
    });
  }

}
