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
import {OWL, RDF, XSD} from "../../../prefixes";
import {
  NegativeDataPropertyOverlayComponent
} from "../negative-data-property-overlay/negative-data-property-overlay.component";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {isBlankNodeId} from "../../../shared/utility";
import {
  NegativeObjectPropertyOverlayComponent
} from "../negativeObjectPropertyOverlay/negative-object-property-overlay/negative-object-property-overlay.component";
import {LexerATNSimulator} from "antlr4ts/atn";
import debug = LexerATNSimulator.debug;

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
  targetValue = `${OWL}targetValue`;
  assertionProperty = `${OWL}assertionProperty`;
  individual = `${OWL}sourceIndividual`;

  constructor(public os: OntologyStateService,
      private dialog: MatDialog) {}

  ngOnChanges(): void  {
    if (this.os.listItem.selected['@id']) {
      this.os.getNegativeProperty().subscribe(data => {
        this.negativeDatatypeProperty = data;
      });
    }
  }
  openAddNegativeDataPropOverlay(): void {
    this.dialog.open(NegativeDataPropertyOverlayComponent).afterClosed().subscribe(() => {
    });
  }

  showRemovePropertyOverlay(prop: JSONLDObject): void {
    this.dialog.open(ConfirmModalComponent,{
      data: {
        content:  `<p>Are you sure you want to remove:<br>
            <strong>${prop[this.assertionProperty][0]['@id']}</strong></p>
            <p>with value:<br><strong>`
            + `${prop[this.targetValue][0]['@value']}</strong></p><p>from:<br><strong>`
            + `${prop[`${OWL}sourceIndividual`][0]["@id"]}</strong>?</p>`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.os.addToDeletions(
            this.os.listItem.versionedRdfRecord.recordId,prop);
        this.os.saveCurrentChanges().subscribe();
      }
    });
  }

  editNegativeDataPropOverlay(p: JSONLDObject){
    const sourceIndividual = p[this.individual][0]["@id"];
    const language = p[this.targetValue][0]["@language"];
    const value = p[this.targetValue][0]["@value"];
    const type = p[this.targetValue][0]['@type']
    this.dialog.open(NegativeDataPropertyOverlayComponent, {
      data: {
        editingProperty: true,
        propertySelect: sourceIndividual,
        propertyValue: value,
        propertyType: type ? type : `${XSD}string`,
        propertyLanguage: language,
        prop:p
      },
    }).afterClosed().subscribe((result) => {
    });
  }

}
