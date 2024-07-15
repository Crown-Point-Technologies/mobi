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
import {Component, Input, OnInit} from '@angular/core';
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {MatDialog} from "@angular/material/dialog";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {ToastService} from "../../../shared/services/toast.service";
import {ManchesterConverterService} from "../../../shared/services/manchesterConverter.service";
import {Subscription} from "rxjs";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {RDFS} from "../../../prefixes";
import {has, map, sortBy} from "lodash";
import {ConfirmModalComponent} from "../../../shared/components/confirmModal/confirmModal.component";
import {first} from "rxjs/operators";
import {JSONLDId} from "../../../shared/models/JSONLDId.interface";
import {GeneralClassAxiomOverlayComponent} from "../general-class-axiom-overlay/general-class-axiom-overlay.component";
import {TrustedHtmlPipe} from "../../../shared/pipes/trustedHtml.pipe";
import {SafeHtml} from "@angular/platform-browser";
import {getSkolemizedIRI} from "../../../shared/utility";
import {html} from "gridjs";

@Component({
  selector: 'general-class-axioms-block',
  templateUrl: './general-class-axioms-block.component.html',
  styleUrls: ['./general-class-axioms-block.component.scss']
})
export class GeneralClassAxiomsBlockComponent implements OnInit {

  private subscriptions = new Subscription();
  htmlValue: SafeHtml;
  generalClassAxioms:string[] = [];
  gcaData:JSONLDObject[];
  generalClassAxiomsData:JSONLDObject[];
  generalClassAxiomList: {iri: string, valuesKey: string} = {iri: `${RDFS}subClassOf`, valuesKey: 'classes'};
  property = this.generalClassAxiomList.iri;
  gcaIRI:string[];
  subClass:string;
  gcas:string[] = [];
  values: { [key: string]: string; }[] = [];
  constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
              private pm: PropertyManagerService,  private safeHtml: TrustedHtmlPipe, private toast: ToastService, private mc: ManchesterConverterService) {}

  ngOnInit() {
    if(!this.generalClassAxiomsData) {
      this.os.getGeneralClassAxioms().subscribe(data => {
            this.generalClassAxiomsData = data;
            console.log("GCAs ALL DATA=>>", data);
            this.updateGCA();
          }
      );
    }

// this.updateGCA();

  }

  updateGCA(){
    const bnodeIndex = this.os.getBnodeIndex(this.generalClassAxiomsData);
    console.log("index GCA*&*&*&*&*&*&*&*",bnodeIndex);

    const bnodeIds = this.getIdsWithSubClassOfProperty(this.generalClassAxiomsData);

    bnodeIds.forEach(bnodeId => {
   //   console.log("bnodeID**************=>",bnodeId);
      const newGCAObj = {'@id': bnodeId};
      if(!this.os.listItem.generalClassAxioms.some(obj=>
          Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))) {
        this.os.listItem.generalClassAxioms.push(newGCAObj);
      }

      this.values = this.os.listItem.generalClassAxioms;
      const gcaResponse = this.mc.gcaJsonldToManchester(bnodeId, this.generalClassAxiomsData, bnodeIndex, true);

  //    console.log("Menches GCAs",gcaResponse);

      // const subClass = "algorithm";
          // this.om.getEntityName(this.os.listItem.selected);
      // const gca = `${gcaResponse} SubClassOf ${subClass}`;
      //const gca = this.processSubClass(bnodeId,gcaResponse);
      //console.log("!@#$%^&^%$_+++_+++__++",gca)
      // this.os.listItem.gca?.push(gcaResponse);
      this.gcas.push(gcaResponse);
      this.os.listItem.blankNodes[bnodeId] = gcaResponse;
    });
    console.log("SELECTED",this.os.listItem);
    localStorage.setItem("projectTab","yes");
  }


  processSubClass(genId:string,result:string,):string {
    console.log("TEST genID",genId);
    console.log("TEST RESULT",result);
    if(result.endsWith("SubClassOf</span>")) {
      let resultStr = result.trim();
      let sc=[];
      for (const obj of this.os.listItem.selectedBlankNodes) {
        if (obj['@id'] && obj['@id'] === genId) {
          sc.push(obj['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]);
          console.log("obj is ",JSON.stringify(obj));
        }
      }
      console.log("##SC$$",sc);
      const subClass = this.om.getEntityName({'@id': sc['@id']});
      console.log("TEST subCLASS",subClass);
      resultStr += subClass;
      return resultStr;
    }
    return result;
  }

  private calcNodeProperties(gca): void {
    this.htmlValue = this.safeHtml.transform(gca, 'html');
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
       // axiomList: this.pm.generalClassAxiomList,
        exp: htmlValue,
        action:'edit',
        id: value['@id']
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {

      if (result) {
        console.log("result",result);
        //this.updateGCA();
        this.removeGCA(index);
        this.updateGCA();
        this.os.saveCurrentChanges().subscribe();
      }
    });
  }
  openRemoveGCAOverlay(value: any, index:number): void {
    console.log("value is "+value+" index is "+index);
    let htmlValue = this.os.getBlankNodeValue(value['@id']) || value['@id'] || value['@value'];
    htmlValue = htmlValue.replace(/<[^>]*>/g,'').split('http')[0].trim();
    this.dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to remove:<br><strong>${htmlValue}</strong>?</p>`,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.removeGCA(index);
        delete this.os.listItem.blankNodes[value["@id"]];
        const deleteGCAsObj = this.findRelatedObjects(this.os.listItem.selectedBlankNodes, value["@id"]);
        console.log("DELETE GCAS",deleteGCAsObj);
        for( const obj of deleteGCAsObj){
          console.log("DELETE obj",obj);
          this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId,
              obj);
          // this.os.listItem.selectedBlankNodes[obj];
        }
        this.os.saveCurrentChanges().subscribe();

      }
    });
  }

  removeGCA(index:number) {
    if(index > -1 && index < this.os.listItem.generalClassAxioms.length) {
      this.os.listItem.generalClassAxioms.splice(index,1);
    }
  }

  showAxiomOverlay(): void {
    this.dialog.open(GeneralClassAxiomOverlayComponent, {
      data: {
     //   axiomList: this.pm.generalClassAxiomList
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string }) => {
      if (result) {
        console.log("result",result);
        this.updateGCA();
      }
    });
  }


  // ngOnDestroy(){
  //   this.subscriptions.unsubscribe();
  // }

}
