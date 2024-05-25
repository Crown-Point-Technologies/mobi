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
import {OntologyManagerService} from '../../../shared/services/ontologyManager.service';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {MatDialog} from '@angular/material/dialog';
import {PropertyManagerService} from '../../../shared/services/propertyManager.service';
import {RDFS} from '../../../prefixes';
import {has, includes, map, sortBy} from 'lodash';
import {GeneralClassAxiomOverlayComponent} from '../general-class-axiom-overlay/general-class-axiom-overlay.component';
import {ManchesterConverterService} from "../../../shared/services/manchesterConverter.service";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {isBlankNodeId} from "../../../shared/utility";

@Component({
  selector: 'general-class-axiom-block',
  templateUrl: './general-class-axiom-block.component.html',
  styleUrls: ['./general-class-axiom-block.component.scss']
})
export class GeneralClassAxiomBlockComponent implements OnInit {
  @Input() property: string;
  generalClassAxioms:string[] = [];
  gcaData:JSONLDObject[];
  generalClassAxiomList: {iri: string, valuesKey: string} = {iri: `${RDFS}subClassOf`, valuesKey: 'classes'};
  iri = this.generalClassAxiomList.iri;
  IRI:string;
  selected:any;
  subClass:string;
  constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
              private pm: PropertyManagerService, private mc: ManchesterConverterService) {}

  ngOnInit() {
    this.IRI = this.os.getEntityNameByListItem(this.iri);

    console.log("IRI",this.IRI);
    console.log("selected",this.os.listItem);
    this.selected = this.os.listItem.selected[this.generalClassAxiomList.iri][0]['@id'];
    console.log("selected IRI",this.selected)
    this.subClass = this.os.getEntityNameByListItem(this.selected);
    console.log("subClass",this.subClass)

// this.os.getGeneralClassAxioms().subscribe(data=> console.log("GCA",data));
// console.log("listedItem",this.os.listItem);
this.os.getSelectedGeneralClassAxiom()
    .subscribe(data => {
        console.log("Data",data);
        this.gcaData = data;
        this.updateGCA(data)
    });
  }

  // ngOnChanges(): void {
  //   this.updateGCAxioms();
  // }
  // updateGCAxioms(): void {
  //   this.gcAxiom =  map(this.pm.generalClassAxiomList, 'iri');
  //
  //   // this.gcaxioms = sortBy(axioms.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityNameByListItem(iri));
  // }

  updateGCA(selectedBlankNodes){
    const bnodeIndex = this.os.getBnodeIndex(selectedBlankNodes);
    console.log("index GCA",bnodeIndex);
    // const bnodeId = bnodeIndex[0]['@id'];
    const bnodeId = this.getIdsWithSubClassOfProperty();
        // "_:genid-ef4a2fd9533a4c2ebc5cacfbdc94d65a17-B648EB07C89D31C3C134387906E4E40B";
    console.log(" selectedBlankNodes bnodeId",bnodeId);
    console.log("selectedBlankNodes",selectedBlankNodes);
    const gcaResponse = this.mc.jsonldToManchester(bnodeId, selectedBlankNodes, bnodeIndex, true);
    console.log("Menches GCA",gcaResponse);
    const check = this.removeHtmlTags(gcaResponse);
    console.log("Menches gcaResponse",check);
    const subClass = this.om.getEntityName(this.os.listItem.selected);

    const gca = `${check} SubClassOf ${subClass}`;
    console.log("gcaerty",gca);
    this.generalClassAxioms?.push(gca);
  }

  removeHtmlTags(inputText: string): string {
    return inputText.replace(/<[^>]*>/g, '');
  }

  getIdsWithSubClassOfProperty(): string {
    for (const obj of this.gcaData) {
      if (obj['http://www.w3.org/2000/01/rdf-schema#subClassOf']) {
        return obj['@id'];
      }
    }
    return null; // If no object with the property is found
  }

  openRemoveOverlay(event: { iri: string, index: number } ){
    console.log("Remove");
  }

  showAxiomOverlay(): void {
    // if (this.om.isClass(this.os.listItem.selected)) {
      this.dialog.open(GeneralClassAxiomOverlayComponent, {
        data: {
          axiomList: this.pm.classAxiomList
        }
      }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
        if (result) {
          this.updateClassHierarchy(result);
        }
      });
    // } else
    //   if (this.om.isObjectProperty(this.os.listItem.selected)) {
    //   this.dialog.open(GeneralClassAxiomOverlayComponent, {
    //     data: {
    //       axiomList: this.pm.objectAxiomList
    //     }
    //   }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
    //     if (result) {
    //       this.updateObjectPropHierarchy(result);
    //     }
    //   });
    // }
    //   else if (this.om.isDataTypeProperty(this.os.listItem.selected)) {
    //   this.dialog.open(GeneralClassAxiomOverlayComponent, {
    //     data: {
    //       axiomList: this.pm.datatypeAxiomList
    //     }
    //   }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
    //     if (result) {
    //       this.updateDataPropHierarchy(result);
    //     }
    //   });
    // }
  }
  updateClassHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
    if (updatedAxiomObj.axiom === `${RDFS}subClassOf` && updatedAxiomObj.values.length) {
      this.os.setSuperClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
      if (includes(this.os.listItem.individualsParentPath, this.os.listItem.selected['@id'])) {
        this.os.updateFlatIndividualsHierarchy(updatedAxiomObj.values);
      }
      this.os.setVocabularyStuff();
    }
  }
  // updateDataPropHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
  //   if (updatedAxiomObj.axiom === `${RDFS}subPropertyOf` && updatedAxiomObj.values.length) {
  //     this.os.setSuperProperties(this.os.listItem.selected['@id'], updatedAxiomObj.values, 'dataProperties');
  //   } else if (updatedAxiomObj.axiom === `${RDFS}domain` && updatedAxiomObj.values.length) {
  //     this.os.addPropertyToClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
  //     this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
  //   }
  // }
  // updateObjectPropHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
  //   if (updatedAxiomObj.axiom === `${RDFS}subPropertyOf` && updatedAxiomObj.values.length) {
  //     this.os.setSuperProperties(this.os.listItem.selected['@id'], updatedAxiomObj.values, 'objectProperties');
  //     if (this.os.containsDerivedSemanticRelation(updatedAxiomObj.values)) {
  //       this.os.setVocabularyStuff();
  //     }
  //   } else if (updatedAxiomObj.axiom === `${RDFS}domain` && updatedAxiomObj.values.length) {
  //     this.os.addPropertyToClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
  //     this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
  //   }
  // }
  protected readonly isBlankNodeId = isBlankNodeId;
}
