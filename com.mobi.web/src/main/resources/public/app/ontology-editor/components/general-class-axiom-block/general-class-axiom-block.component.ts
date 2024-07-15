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
import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {OntologyManagerService} from '../../../shared/services/ontologyManager.service';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {MatDialog} from '@angular/material/dialog';
import {PropertyManagerService} from '../../../shared/services/propertyManager.service';
import {RDFS} from '../../../prefixes';
import {has, includes, map, sortBy} from 'lodash';
import {GeneralClassAxiomOverlayComponent} from '../general-class-axiom-overlay/general-class-axiom-overlay.component';
import {ManchesterConverterService} from '../../../shared/services/manchesterConverter.service';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';
import {isBlankNodeId} from '../../../shared/utility';
import {ConfirmModalComponent} from '../../../shared/components/confirmModal/confirmModal.component';
import {first} from 'rxjs/operators';
import {JSONLDId} from '../../../shared/models/JSONLDId.interface';
import {ToastService} from '../../../shared/services/toast.service';
import {Subscription} from 'rxjs';
import {OntologyListItem} from '../../../shared/models/ontologyListItem.class';
import { Console } from 'console';

@Component({
  selector: 'general-class-axiom-block',
  templateUrl: './general-class-axiom-block.component.html',
  styleUrls: ['./general-class-axiom-block.component.scss']
})
export class GeneralClassAxiomBlockComponent implements OnInit, OnDestroy, OnChanges {
  private subscriptions = new Subscription();
  generalClassAxioms:string[] = [];
  gcaData:JSONLDObject[];
  generalClassAxiomsData:JSONLDObject[];
  generalClassAxiomList: {iri: string, valuesKey: string} = {iri: `${RDFS}subClassOf`, valuesKey: 'classes'};
  property = this.generalClassAxiomList.iri;
  gcaIRI:string[];
  subClass:string;
  gcas:string[];
  values: { [key: string]: string; }[] = [];
  others: { [key: string]: string; }[] = [];
  @Input()
  projectTab:string;
  allGca=[];
  constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
              private pm: PropertyManagerService, private toast: ToastService, private mc: ManchesterConverterService) {}

  ngOnInit() {
if (!this.gcaData && this.os.listItem.selected['@id']) {
  this.os.getSelectedGeneralClassAxiom()
      .subscribe(data => {
        this.gcaData = data;
        this.updateGCA();
      });
}
  }

  ngOnChanges() {
    this.values = this.os.listItem.generalClassAxiom;
    this.others = this.os.listItem.gcaOthers;
  }

  updateGCA(){
    const bnodeIndex = this.os.getBnodeIndex(this.gcaData);

    const bnodeIds = this.getIdsWithSubClassOfProperty(this.gcaData);
//    console.log("bnodeIds",bnodeIds);

    bnodeIds.forEach(bnodeId => {
//      console.log("BNODEID************==>>",bnodeId);
      const newGCAObj = {'@id': bnodeId};
      // if(!this.os.listItem.generalClassAxiom.some(obj=>
      //   Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))) {
      //   this.os.listItem.generalClassAxiom.push(newGCAObj);
      // }

      const gcaResponse = this.mc.gcaJsonldToManchester(bnodeId, this.gcaData, bnodeIndex, true);
      // this.allGca.push(gcaResponse);
      const isGCAS = this.hasIRISAfterSubClassOf(gcaResponse);
      if (isGCAS){
        if (!this.os.listItem.gcaOthers.some(obj=>
          Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))) {
          this.os.listItem.gcaOthers.push(newGCAObj);
          this.os.listItem.generalClassAxioms.push(newGCAObj);
        }
      } else {
        if (!this.os.listItem.generalClassAxiom.some(obj=>
            Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))) {
          this.os.listItem.generalClassAxiom.push(newGCAObj);
          this.os.listItem.generalClassAxioms.push(newGCAObj);
        }
        // if(this.os.listItem.gcaMap.has("sufficient")) {
        //   this.os.listItem.gcaMap.get("sufficient").set(bnodeId, gcaResponse);
        // } else {
        //   const map = new Map<string, string>();
        //   map.set(bnodeId, gcaResponse);
        //   this.os.listItem.gcaMap.set("sufficient", map);
        // }
      }
      this.os.listItem.blankNodes[bnodeId] = gcaResponse;
      this.values = this.os.listItem.generalClassAxiom;
      this.others = this.os.listItem.gcaOthers;
    });
  }

  hasIRISAfterSubClassOf(inputStr: string): boolean {
    const pattern = /SubClassOf\s*(.*?)<span/;

    return pattern.test(inputStr);
  }

  processSubClass(genId:string,result:string,):string {
    let resultStr = result.trim();
    let sc;
    for (const obj of this.os.listItem.selectedBlankNodes) {
      if (obj['@id'] && obj['@id'] === genId) {
        sc =  obj['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0];
      }
    }
    const subClass = this.om.getEntityName({'@id': sc['@id']});
    resultStr += ` <span class="manchester-rest">subClassOf</span> ${subClass}`;
    return resultStr;
  }

  getIdsWithSubClassOfProperty(gca): string[] {
//    console.log("252525252525",typeof(gca));
    const subClassIds:string[]=[];
    for (const obj of gca) {
//      console.log("Objext 565656565656:json: ",JSON.stringify(obj));
      this.os.listItem.selectedBlankNodes.push(obj);
      if (obj['http://www.w3.org/2000/01/rdf-schema#subClassOf']) {
        // console.log("CHECKK OBJ ID",obj["@id"]);
        subClassIds.push(obj['@id']);
        // console.log("MAP of GCA",this.os.listItem.gcaMap);
      }
    }
    return subClassIds;
  }

  // openRemoveOverlay(event: {iri: string, index: number}): void {
  //   this.dialog.open(ConfirmModalComponent, {
  //     data: { content: this.os.getRemovePropOverlayMessage(event.iri, event.index) }
  //   }).afterClosed().subscribe(result => {
  //     if (result) {
  //       this.os.removeProperty(event.iri, event.index)
  //           .pipe(first())
  //           .subscribe( (res) => {
  //             // this.updateAxioms();
  //             this.removeFromHierarchy(event.iri, res as JSONLDId);
  //           });
  //     }
  //   });
  // }

  // removeFromHierarchy(axiom: string, axiomObject: JSONLDId): void {
  //   if (`${RDFS}subClassOf` === axiom && !isBlankNodeId(axiomObject['@id'])) {
  //     this.os.deleteEntityFromParentInHierarchy(this.os.listItem.classes, this.os.listItem.selected['@id'], axiomObject['@id']);
  //     this.os.listItem.classes.flat = this.os.flattenHierarchy(this.os.listItem.classes);
  //     this.os.listItem.individualsParentPath = this.os.getIndividualsParentPath(this.os.listItem);
  //     this.os.listItem.individuals.flat = this.os.createFlatIndividualTree(this.os.listItem);
  //     this.os.setVocabularyStuff();
  //   }
  // }

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
 //   console.log('html val is '+htmlValue);
    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data: {
//        axiomList: this.pm.generalClassAxiomList,
        exp: htmlValue,
        action: 'edit',
        id: value['@id']
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
  //    console.log("general clss axiom is "+JSON.stringify(this.pm.generalClassAxiomList));

      if (result) {
     //   console.log("result",result);
        //this.updateGCA();
        // this.removeGCA(value['@id'],index);
        // const deleteBnodeId = {'@id': bnodeId};
        // const i = this.os.listItem.gcaOthers.indexOf(data);
        // const i2 = this.gcaData.indexOf(deleteBnodeId);
        this.updateGCA();
        this.values = this.os.listItem.generalClassAxiom;
        this.others = this.os.listItem.gcaOthers;
        //this.os.saveCurrentChanges().subscribe();
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
        this.removeGCA(iri['@id'],index);
        this.values = this.os.listItem.generalClassAxiom;
        this.others = this.os.listItem.gcaOthers;
        const deleteGCAObj:JSONLDObject[]= this.findRelatedObjects(this.os.listItem.selectedBlankNodes, iri['@id']);

        for ( const obj of deleteGCAObj){
          this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId,
              obj);
        }

        this.os.saveCurrentChanges().subscribe();

        // this.removeGCA(index);
      }
    });
  }

  getGCAFromBlankeNode(gca): JSONLDObject[] {
    const subClassIds:JSONLDObject[]=[];
    for (const obj of this.os.listItem.selectedBlankNodes) {
      if (obj['@id'] === gca) {
        subClassIds.push(obj);
        break;
      }
    }
    return subClassIds;
  }

  removeGCA(bnodeId:string, index:number) {
    if (index > -1 && index < this.os.listItem.generalClassAxiom.length) {
      const data = this.os.listItem.generalClassAxiom.find(g=>g['@id']===bnodeId);
      const deleteBnodeId = {'@id': bnodeId};
      const i = this.os.listItem.generalClassAxiom.indexOf(data);
      const i2 = this.gcaData.indexOf(deleteBnodeId);
      if (i == index) {
        this.os.listItem.generalClassAxiom.splice(index, 1);
        this.gcaData.splice(i2,1);
        //this.values = this.os.listItem.generalClassAxiom;
      }
    }
    if (index > -1 && index < this.os.listItem.gcaOthers.length) {
      const data = this.os.listItem.gcaOthers.find(g=>g['@id']===bnodeId);
      const deleteBnodeId = {'@id': bnodeId};
      const i = this.os.listItem.gcaOthers.indexOf(data);
      const i2 = this.gcaData.indexOf(deleteBnodeId);
      if (i == index) {
        this.os.listItem.gcaOthers.splice(index, 1);
        // this.others = this.os.listItem.gcaOthers;
        this.gcaData.splice(i2,1);
      }
    }
  }

  showAxiomOverlay(): void {
      this.dialog.open(GeneralClassAxiomOverlayComponent, {
        data: {
       //   axiomList: this.pm.generalClassAxiomList
        }
      }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
        if (result) {
    //      console.log("result",result);
            this.updateGCA();
          // this.updateClassHierarchy(result);
        }
      });
  }

  // updateClassHierarchy(updatedAxiomObj: { generalClassAxiom: string, values: string }): void {
  //   if (updatedAxiomObj.axiom === `${RDFS}subClassOf` && updatedAxiomObj.values.length) {
  //     this.os.setSuperClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
  //     if (includes(this.os.listItem.individualsParentPath, this.os.listItem.selected['@id'])) {
  //       this.os.updateFlatIndividualsHierarchy(updatedAxiomObj.values);
  //     }
  //     this.os.setVocabularyStuff();
  //   }
  // }
  ngOnDestroy(){
    this.subscriptions.unsubscribe();
  }

  protected readonly isBlankNodeId = isBlankNodeId;
}
