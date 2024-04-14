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
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PropertyChainOverlayComponent } from '../property-chain-overlay/property-chain-overlay.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import {OWL} from '../../../prefixes';
import {CatalogManagerService} from "../../../shared/services/catalogManager.service";

interface PropertyChainModel {
  genId?:string,
  values?:string[],
  formattedValuesStr:string
}
@Component({
  selector: 'app-property-chain-block',
  templateUrl: './property-chain-block.component.html',
  styleUrls: ['./property-chain-block.component.scss'],
})

export class PropertyChainBlockComponent implements OnInit, OnChanges {
  @Input() selected: JSONLDObject;
  additional: string[] = [];

  hasParent: string;
  objectProp:string;
  objectPropertyMap:Map<string, string[]> = new Map();
  objectMap:Map<string,string>=new Map();
  genidMap = new Map<string,string[]>();
  propertyChainDatas:PropertyChainModel[]= [];
  oldHP:string;
  constructor(
      private dialog: MatDialog,
      public os: OntologyStateService,
      public om: OntologyManagerService,
      private cm : CatalogManagerService
  ) { }

  async ngOnInit(): Promise<any> {
    this.oldHP = this.hasParent;
    this.os.saveCurrentChanges().subscribe();
    this.updatePropertyChainData();
  }

    async ngOnChanges() {
      const selectedObjProp = this.os.listItem.selected['@id'];
      this.objectProp = selectedObjProp.split('#')[1];
      const selectedProperty: string = this.os.listItem.selected['http://purl.org/dc/terms/title'];
        this.hasParent = selectedProperty?.[0]['@value'] ?? '';

       if(this.oldHP && this.oldHP !== this.hasParent){
        this.updateProperties();
       }
  }

  updatePropertyChainData() {
    const selectedResponse:any = this.os.listItem.selected;
    const genids = this.extractGenids(selectedResponse);
    const response = this.os.listItem.selectedBlankNodes;
    const properties = this.extractPropertyChainValues(response,genids);
    const newProperties:string[] = [];

    for (const [key,value] of this.genidMap.entries()){
      const chainItem : PropertyChainModel= {
        genId: key,
        values: value,
        formattedValuesStr: this.formatAdditionalProperties(value)
      };
      this.propertyChainDatas.push(chainItem);
    }
    properties.forEach(data =>{
      newProperties.push(this.formatAdditionalProperties(data));
    });
    this.objectPropertyMap.set(this.objectProp,newProperties);
  }

  extractGenids(response: any[]): string[] {
    const genids = [];

    if (this.objectProp && response['http://www.w3.org/2002/07/owl#PropertyChainAxiom']) {
        const propertyChainAxiom = response['http://www.w3.org/2002/07/owl#PropertyChainAxiom'];
        if (propertyChainAxiom && Array.isArray(propertyChainAxiom)) {
          propertyChainAxiom.forEach(item => {
            const genid = item['@id']?.split('/').pop().split('-')[1];
            genids.push(genid);
          });
        }
      return genids;
    }
  }

  extractPropertyChainValues(response: any[], genids: string[]): string[][] {
    response.forEach(obj => {
      const id= obj['@id']?.split('/').pop().split('-')[1];
      if (genids?.includes(id)) {
        const value = obj['http://www.w3.org/1999/02/22-rdf-syntax-ns#first'][0]['@id'].split('#').pop();
        if (!this.genidMap.has(id)) {
          this.genidMap.set(id, []);
        }
        this.genidMap.get(id).push(value.toString());
      }
    });

    return Array.from(this.genidMap.values());
  }

  updateProperties(){
    if (this.objectPropertyMap.has(this.objectProp)) {

      if(this.propertyChainDatas.length >0){
        this.propertyChainDatas.forEach(p=>{
          if(p.values){
          p.formattedValuesStr= this.formatAdditionalProperties(p.values);
          }
        });
      }
    }
  }

  formatAdditionalProperties(chains: string[]) {
    if (chains != null && chains.length > 0) {

      let formatString = 'x';
      chains.forEach(p=> {
          formatString += ` '${p}' &nbsp<span class="blue-o">o</span>&nbsp`;
      });
      formatString = formatString.substring(0, formatString.length - 34);
      formatString += `z => x  '${this.hasParent}' z`;

      return formatString;
    }
  }

  extractPropertyChainAxioms(response: any): string {
    const propertyChainAxioms: string[] = [];

    if (response && Array.isArray(response)) {
      response.forEach((addition: any) => {
          if (addition['http://www.w3.org/2002/07/owl#PropertyChainAxiom'] &&
              Array.isArray(addition['http://www.w3.org/2002/07/owl#PropertyChainAxiom'])) {
            addition['http://www.w3.org/2002/07/owl#PropertyChainAxiom'].forEach((item: any) => {
              const genid = item['@id']?.split('/').pop()?.split('-')[1];
              if (genid) {
                propertyChainAxioms.push(genid);
              }
            });
          }
      });
    }

    return propertyChainAxioms[propertyChainAxioms.length - 1];
  }

  openAddOverlay(): void {
    this.dialog
        .open(PropertyChainOverlayComponent, {
          data: {
            editing: false,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.cm.getData.subscribe(data =>{
              const newGenid = this.extractPropertyChainAxioms(data.additions);

              const properties = this.extractPropertyChainValues(data.additions,[newGenid]);

              const chainItem : PropertyChainModel= {
                genId: newGenid,
                values: properties[properties.length - 1],
                formattedValuesStr: this.formatAdditionalProperties(properties[properties.length - 1])
              };
              this.propertyChainDatas.push(chainItem);
            });

          }
        });
  }

  extractRemovePropertyChainValues(response: JSONLDObject[], genId: string): JSONLDObject[] {
    return response.filter(obj => obj['@id'].includes(genId));
  }
  openRemoveOverlay(propIndex: number, propValue: string,removeGenId:string) {
    this.dialog
        .open(ConfirmModalComponent, {
          data: {
            content: `<p>Are you sure you want to remove:<br><strong>${propValue}</strong>?</p>`,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const response:JSONLDObject = this.os.listItem.selected;
            const responseBlankNode:JSONLDObject[] = this.os.listItem.selectedBlankNodes;
            const deletionObj:any[] = [];
            const deletedData :JSONLDObject[] = this.extractRemovePropertyChainValues(responseBlankNode,removeGenId);
            deletionObj.push(deletedData);
            if (response['http://www.w3.org/2002/07/owl#PropertyChainAxiom']) {
              const propertyChainAxiom = response['http://www.w3.org/2002/07/owl#PropertyChainAxiom'];
              const axiomData:any[]=[];
              if (propertyChainAxiom && Array.isArray(propertyChainAxiom)) {
                propertyChainAxiom.forEach(item => {
                  const genid = item['@id'].split('/').pop().split('-')[1];
                  if (genid === removeGenId){
                    propertyChainAxiom.splice(propIndex,1);
                  }
                });
              }
            }
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, {
              '@id': this.os.listItem.selected['@id'],'@type': ['http://www.w3.org/2002/07/owl#PropertyChainAxiom'],
              [`${OWL}PropertyChainAxiom`]: deletionObj
            });
            this.os.saveCurrentChanges().subscribe();
            const index = this.propertyChainDatas.findIndex(item => item.genId === removeGenId);
            if(index !== -1){
              this.propertyChainDatas.splice(index,1);
            }
          }
        });
  }
  extractValues(inputString:string):string[]{
    const regex = /'(.*?)'(?=.*z\s*=>)/g;
    const extractValues:string[] = [];
    let match;

    while ((match = regex.exec(inputString)) !== null){
        extractValues.push(match[1]);
    }
    return extractValues;
  }

  editClicked(index: number, property: string, removeGenId:string,values:string[]) {
    this.additional = [];
    const props = this.extractValues(property);
    this.dialog
        .open(PropertyChainOverlayComponent, {
          data: {
            editing: true,
            additionalProperties: props,
            genId:removeGenId,
            removeIndex:index
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const updatedProperty = this.formatAdditionalProperties(result.additionalProperties);
            if(updatedProperty && updatedProperty.length > 0){
              this.propertyChainDatas[index].genId = removeGenId;
              this.propertyChainDatas[index].values = values;
              this.propertyChainDatas[index].formattedValuesStr = updatedProperty;
            }
          }
        });
  }

}
