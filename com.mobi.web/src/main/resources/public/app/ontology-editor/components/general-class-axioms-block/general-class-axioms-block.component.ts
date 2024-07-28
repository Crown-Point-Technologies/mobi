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
import {Component, OnInit} from '@angular/core';
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {MatDialog} from "@angular/material/dialog";
import {ManchesterConverterService} from "../../../shared/services/manchesterConverter.service";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {GeneralClassAxiomOverlayComponent} from "../general-class-axiom-overlay/general-class-axiom-overlay.component";
import {SafeHtml} from "@angular/platform-browser";

@Component({
  selector: 'general-class-axioms-block',
  templateUrl: './general-class-axioms-block.component.html',
  styleUrls: ['./general-class-axioms-block.component.scss']
})
export class GeneralClassAxiomsBlockComponent implements OnInit {

  htmlValue: SafeHtml;
  generalClassAxiomsData:JSONLDObject[];
  values: { [key: string]: string; }[] = [];
  constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
              private mc: ManchesterConverterService) {}

  ngOnInit() {
    if(!this.generalClassAxiomsData) {
      this.os.getGeneralClassAxioms().subscribe(data => {
            this.generalClassAxiomsData = data;
            this.updateGCA();
          }
      );
    }


  }

  updateGCA(){
    this.values = [];
    const bnodeIndex = this.os.getBnodeIndex(this.generalClassAxiomsData);

    const bnodeIds = this.getIdsWithSubClassOfProperty(this.generalClassAxiomsData);

    bnodeIds.forEach(bnodeId => {
      const newGCAObj = {'@id': bnodeId};
      if (!this.values.some(obj =>
          Object.values(obj).some(val => Object.values(newGCAObj).includes(val))
      )) {
        this.values.push(newGCAObj);
      }
      this.os.listItem.blankNodes[bnodeId] = this.mc.gcaJsonldToManchester(bnodeId, this.generalClassAxiomsData, bnodeIndex, true);
    });

  }

  getIdsWithSubClassOfProperty(gca): string[] {
    const subClassIds:string[]=[];
    for (const obj of gca) {
      this.os.listItem.selectedBlankNodes.push(obj);
      if (obj['http://www.w3.org/2000/01/rdf-schema#subClassOf']) {
        subClassIds.push(obj['@id']);
      }
    }
    return subClassIds;
  }

  findRelatedObjects(selectedBlankNode:  JSONLDObject[], genid: string):  JSONLDObject[] {
    let result: JSONLDObject[]  = [];

    let lookup: { [id: string]:  JSONLDObject } = {};
    selectedBlankNode.forEach(node => {
      lookup[node["@id"]] = node;
    });

    const findRelated = (nodeId: string)=> {
      if (lookup[nodeId] && !result.includes(lookup[nodeId])) {
        result.push(lookup[nodeId]);
        let node = lookup[nodeId];
        for (let key in node) {
          if (key.startsWith("http://") && Array.isArray(node[key])) {
            node[key].forEach((item: any) => {
              if (item["@id"]) {
                findRelated(item["@id"]);
              }
            });
          }
        }
      }
    }

    findRelated(genid);

    return result;
  }

  openEditGCAOverlay(value: any, index:number): void {
    let htmlValue = this.os.getBlankNodeValue(value['@id']) || value['@id'] || value['@value'];
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();

    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data: {
        exp: htmlValue,
        action:'edit',
        id: value['@id']
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {

      if (result) {
        this.os.getGeneralClassAxioms().subscribe(data => {
              this.generalClassAxiomsData = data;
              this.updateGCA();
            }
        );

      }
    });
  }
  openRemoveGCAOverlay(value: any, index:number): void {
    let htmlValue = this.os.getBlankNodeValue(value['@id']) || value['@id'] || value['@value'];
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();
    this.dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to remove:<br><strong>${htmlValue}</strong>?</p>`,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        delete this.os.listItem.blankNodes[value["@id"]];
        const deleteGCAsObj = this.findRelatedObjects(this.os.listItem.selectedBlankNodes, value["@id"]);
        for( const obj of deleteGCAsObj){
          this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId,
              obj);
        }
        this.os.saveCurrentChanges().subscribe();
        this.os.getGeneralClassAxioms().subscribe(data => {
          this.generalClassAxiomsData = data;
          this.updateGCA();
        });

        console.log("after deletion SELECTEd",this.os.listItem);
      }
    });
  }

  showAxiomOverlay(): void {
    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data :  {

      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
      if (result) {
        this.os.getGeneralClassAxioms().subscribe(data => {
              this.generalClassAxiomsData = data;
              this.updateGCA();
            }
        );

      }
    });
  }

}
