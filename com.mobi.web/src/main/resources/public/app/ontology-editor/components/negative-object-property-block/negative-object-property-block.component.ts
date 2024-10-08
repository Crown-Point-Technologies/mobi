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
import {has, sortBy} from "lodash";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {JSONLDId} from "../../../shared/models/JSONLDId.interface";
import {
  NegativeObjectPropertyOverlayComponent
} from "../negativeObjectPropertyOverlay/negative-object-property-overlay/negative-object-property-overlay.component";
import {isBlankNodeId} from "../../../shared/utility";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {OWL} from "../../../prefixes";
import {PropertyChainOverlayComponent} from "../property-chain-overlay/property-chain-overlay.component";

@Component({
  selector: 'negative-object-property-block',
  templateUrl: './negative-object-property-block.component.html',
  styleUrls: ['./negative-object-property-block.component.scss']
})
export class NegativeObjectPropertyBlockComponent implements OnChanges {
  @Input() selected;

  objectProperties: string[] = [];
  objectPropertiesFiltered: string[] = [];
  datas = [];
  typeValue = "owl:NegativePropertyAssertion";
  targetIndividual = `${OWL}targetIndividual`;
  assertionProperty = `${OWL}assertionProperty`;
  constructor(public os: OntologyStateService,
              private dialog: MatDialog) {}

  ngOnChanges(): void {
    if (this.os.listItem.selected['@id']) {
      this.os.getNegativeProperty().subscribe(data => {
        this.datas = data;
      });
    }
  }
  openAddNegativeObjectPropOverlay(): void {
    this.dialog.open(NegativeObjectPropertyOverlayComponent).afterClosed().subscribe((result) => {
    });
  }
  showRemovePropertyOverlay(prop: JSONLDObject, index: number): void {
    this.dialog.open(ConfirmModalComponent,{
      data: {
        content:  `<p>Are you sure you want to remove:<br>
            <strong>${prop['http://www.w3.org/2002/07/owl#assertionProperty'][0]['@id']}</strong></p>
            <p>with value:<br><strong>`
            + `${prop["http://www.w3.org/2002/07/owl#targetIndividual"][0]["@id"]}</strong></p><p>from:<br><strong>`
            + `${prop['http://www.w3.org/2002/07/owl#sourceIndividual'][0]['@id']}</strong>?</p>`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.os.addToDeletions(
            this.os.listItem.versionedRdfRecord.recordId,prop);
        this.os.saveCurrentChanges().subscribe();
      }
    });
  }

  editNegativeObjectPropOverlay(iri:JSONLDObject): void {
    const individual = iri[this.targetIndividual][0]["@id"];
    const op = iri[this.assertionProperty][0]["@id"];
    this.dialog.open(NegativeObjectPropertyOverlayComponent, {
      data: {
        editing: true,
        prop:iri,
        op:op,
        individual:individual
      },
    }).afterClosed().subscribe((result) => {
    });
  }
}
