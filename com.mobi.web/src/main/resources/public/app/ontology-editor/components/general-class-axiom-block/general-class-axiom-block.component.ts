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
import {OntologyManagerService} from '../../../shared/services/ontologyManager.service';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {MatDialog} from '@angular/material/dialog';
import {GeneralClassAxiomOverlayComponent} from '../general-class-axiom-overlay/general-class-axiom-overlay.component';
import {ManchesterConverterService} from '../../../shared/services/manchesterConverter.service';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';
import {ConfirmModalComponent} from '../../../shared/components/confirmModal/confirmModal.component';
import {switchMap} from "rxjs/operators";
import {Subject, Subscription} from "rxjs";
import {SharedDataManagerService} from "../../../shared/services/shared-data-manager.service";

@Component({
  selector: 'general-class-axiom-block',
  templateUrl: './general-class-axiom-block.component.html',
  styleUrls: ['./general-class-axiom-block.component.scss']
})
export class GeneralClassAxiomBlockComponent implements OnInit {
  private subscription = new Subscription();
  private destroy$ = new Subject<void>();
  gcaData:JSONLDObject[];
  values: { [key: string]: string; }[] = [];
  others: { [key: string]: string; }[] = [];
  constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
              private mc: ManchesterConverterService, private sdm:SharedDataManagerService) {}

  ngOnInit() {

    this.subscription.add(
        this.sdm.annotationSubject.pipe(
            switchMap(() => this.os.getSelectedGeneralClassAxiom())
        ).subscribe(data => {
          this.gcaData = data;
          this.updateGCA();
        })
    );

    if (this.os.listItem.selected['@id']) {
      this.os.getSelectedGeneralClassAxiom()
          .subscribe(data => {
            this.gcaData = data;
            this.updateGCA();
          });
    }
  }

  updateGCA(){
    this.values = [];
    this.others = [];
    const bnodeIndex = this.os.getBnodeIndex(this.gcaData);

    const bnodeIds = this.getIdsWithSubClassOfProperty(this.gcaData);
    let isGCAS;
    bnodeIds.forEach(bnodeId => {
      const newGCAObj = {'@id': bnodeId};

      const gcaResponse = this.mc.gcaJsonldToManchester(bnodeId, this.gcaData, bnodeIndex, true);
      isGCAS = this.hasIRISAfterSubClassOf(gcaResponse);
      if (isGCAS){
        this.others.push(newGCAObj);
      } else {
        this.values.push(newGCAObj);
      }
      this.os.listItem.blankNodes[bnodeId] = gcaResponse;
    });
  }

  hasIRISAfterSubClassOf(inputStr: string): boolean {
    const pattern = /SubClassOf\s*(.*?)<span/;

    return pattern.test(inputStr);
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
    const result: JSONLDObject[]  = [];

    const lookup: { [id: string]:  JSONLDObject } = {};
    selectedBlankNode.forEach(node => {
      lookup[node['@id']] = node;
    });

    const findRelated = (nodeId: string)=> {
      if (lookup[nodeId] && !result.includes(lookup[nodeId])) {
        result.push(lookup[nodeId]);
        const node = lookup[nodeId];
        for (const key in node) {
          if (key.startsWith('http://') && Array.isArray(node[key])) {
            node[key].forEach((item: any) => {
              if (item['@id']) {
                findRelated(item['@id']);
              }
            });
          }
        }
      }
    };

    findRelated(genid);

    return result;
  }

  openEditGCAOverlay(value: any, index:number): void {
    let htmlValue = this.os.getBlankNodeValue(value['@id']) || value['@id'] || value['@value'];
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();
    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data: {
        exp: htmlValue,
        action: 'edit',
        id: value['@id']
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
      if (result) {
        this.os.getSelectedGeneralClassAxiom()
            .subscribe(data => {
              this.gcaData = data;
              this.updateGCA();
            });
      }
    });
  }

  openRemoveGCAOverlay(iri: any, index:number): void {
    let htmlValue = this.os.getBlankNodeValue(iri['@id']) || iri['@id'] || iri['@value'];
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();
    this.dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to remove:<br><strong>${htmlValue}</strong>?</p>`,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        const deleteGCAObj:JSONLDObject[]= this.findRelatedObjects(this.os.listItem.selectedBlankNodes, iri['@id']);

        for ( const obj of deleteGCAObj){
          this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId,
              obj);
        }
        this.os.saveCurrentChanges().subscribe();
        this.os.getSelectedGeneralClassAxiom()
            .subscribe(data => {
              this.gcaData = data;
              this.updateGCA();
            });
      }
    });
  }

  showAxiomOverlay(): void {
    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data : {

      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
      if (result) {
        this.os.getSelectedGeneralClassAxiom()
            .subscribe(data => {
              this.gcaData = data;
              this.updateGCA();
            });
      }
    });
  }

  ngOnDestroy(): void {
    // Complete the destroy subject to clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
  }
}
