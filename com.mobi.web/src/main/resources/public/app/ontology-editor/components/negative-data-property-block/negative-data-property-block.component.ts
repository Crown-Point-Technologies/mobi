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
import {get, has, sortBy} from "lodash";
import {RDF, XSD} from "../../../prefixes";
import {
  NegativeDataPropertyOverlayComponent
} from "../negative-data-property-overlay/negative-data-property-overlay.component";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {isBlankNodeId} from "../../../shared/utility";

@Component({
  selector: 'negative-data-property-block',
  templateUrl: './negative-data-property-block.component.html',
  styleUrls: ['./negative-data-property-block.component.scss']
})
export class NegativeDataPropertyBlockComponent implements OnChanges {
@Input() selected; // Here to trigger on changes

  dataProperties: string[] = [];
  dataPropertiesFiltered: string[] = [];
  negativeDatatypeProperty = [];
  typeValue = "owl:NegativePropertyAssertion";
  targetValue = 'http://www.w3.org/2002/07/owl#targetValue';

  constructor(public os: OntologyStateService,
      private dialog: MatDialog) {}

  ngOnChanges(): void  {
    // this.updatePropertiesFiltered();
    if (this.os.listItem.selected['@id']) {
      this.os.getNegativeProperty().subscribe(data => {
        this.negativeDatatypeProperty = data;
      });
    }
  }
  // updatePropertiesFiltered(): void {
  //   this.dataProperties = Object.keys(this.os.listItem.dataProperties.iris);
  //   this.dataPropertiesFiltered = sortBy(this.dataProperties.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityNameByListItem(iri));
  // }
  openAddNegativeDataPropOverlay(): void {
    const data = {
      editingProperty: false,
      propertySelect: undefined,
      propertyValue: '',
      propertyType: `${XSD}string`,
      propertyIndex: 0,
      propertyLanguage: 'en'
    };
    this.dialog.open(NegativeDataPropertyOverlayComponent, { data }).afterClosed().subscribe(() => {
      // this.updatePropertiesFiltered();
    });
  }

  showRemovePropertyOverlay(prop: JSONLDObject): void {
    this.dialog.open(ConfirmModalComponent,{
      data: {
        content:  `<p>Are you sure you want to remove:<br>
            <strong>${prop['http://www.w3.org/2002/07/owl#assertionProperty'][0]['@id']}</strong></p>
            <p>with value:<br><strong>`
            + `${prop[this.targetValue][0]['@value']}</strong></p><p>from:<br><strong>`
            + `${prop["http://www.w3.org/2002/07/owl#sourceIndividual"][0]["@id"]}</strong>?</p>`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.os.addToDeletions(
            this.os.listItem.versionedRdfRecord.recordId,prop);
        this.os.saveCurrentChanges().subscribe();
        this.os.getNegativeProperty().subscribe(data => {
          this.negativeDatatypeProperty = data;
        });
        // this.updatePropertiesFiltered();
      }
    });
  }

}
