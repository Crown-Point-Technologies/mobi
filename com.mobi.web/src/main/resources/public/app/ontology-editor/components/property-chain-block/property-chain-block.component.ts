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
import {Component, Input, OnChanges} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { OntologyManagerService } from "../../../shared/services/ontologyManager.service";
import { PropertyChainOverlayComponent } from "../property-chain-overlay/property-chain-overlay.component";
import { OntologyStateService } from "../../../shared/services/ontologyState.service";
import { JSONLDObject } from "../../../shared/models/JSONLDObject.interface";
import { ConfirmModalComponent } from "../../../shared/components/confirmModal/confirmModal.component";

@Component({
  selector: "app-property-chain-block",
  templateUrl: "./property-chain-block.component.html",
  styleUrls: ["./property-chain-block.component.scss"],
})
export class PropertyChainBlockComponent implements OnChanges {
  @Input() selected: JSONLDObject;
  additional: string[] = [];

  propMap: string[] = [];
  hasParent: string;
  objectProp:string;
  propertyChainMap = new Map<string,string[]>();

  constructor(
      private dialog: MatDialog,
      public os: OntologyStateService,
      public om: OntologyManagerService
  ) { }

  async ngOnChanges(): Promise<any> {
    const selectedObjProp = this.os.listItem.selected["@id"];
    this.objectProp = selectedObjProp.split("#")[1];
    let selectedProperty: string = this.os.listItem.selected["http://purl.org/dc/terms/title"];
    this.hasParent = selectedProperty?.[0]['@value'] ??  '';
    this.updateProperties();
  }

  updateProperties(){
    if(this.os.listItem.objectPropertyMap.has(this.objectProp)) {
      const properties = this.os.listItem.objectPropertyMap.get(this.objectProp);
      this.os.listItem.objectPropertyMap.delete(this.objectProp);
      let checkProp:string[][]=[];
      properties.forEach(property => {
        checkProp.push(this.extractValues(property));
      });
      const newProp:string[] = [];
      checkProp.forEach(data =>{
        newProp.push(this.formatAdditionalProperties(data));
      });
      this.os.listItem.objectPropertyMap.set(this.objectProp, newProp);
      this.propMap = newProp;
    }
  }

  /*async parseRdfData(data): Promise<any[]> {
    const formattedData = [];
    const expanded = await jsonld.expand(data);
    const flattened = await jsonld.flatten(expanded);
    flattened.forEach(node => {
      const nodeId = node['@id'];
      const firstElements = node['http://www.w3.org/1999/02/22-rdf-syntax-ns#first'].map(el => el['@id']);
      const secondElements = node['http://www.w3.org/1999/02/22-rdf-syntax-ns#second'] ? node['http://www.w3.org/1999/02/22-rdf-syntax-ns#second'].map(el => el['@id']) : [];
      const nextNode = node['http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'][0]['@id'];
      formattedData.push({ nodeId, firstElements, secondElements, nextNode });
    });
    return formattedData;
  }*/
  /*getMaxLength(data) {
    let maxLength = 0;
    for (const item of data) {
      if (item.firstElements.length > maxLength) {
        maxLength = item.firstElements.length;
      }
    }
    return maxLength;
  }*/
  /*createArrays(maxLength) {
    const result = [];
    for (let i = 0; i < maxLength; i++) {
      result.push([]);
    }
    return result;
  }*/
  /*processData(data, dataArrays) {
    const propertyChainDatas = [];
    data.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    data.forEach((node): void => {
      if (node.firstElements && node.firstElements.length > 0 && dataArrays && dataArrays.length > 0) {
        for (let index = 0; index < node.firstElements.length; index++) {
          const element = node.firstElements[index];
          dataArrays[index].push(element.replace(`${this.os.listItem.ontologyId}#`, ""));
        }
        const modifiedFirstElements = node.firstElements.map((element) => element);
        propertyChainDatas.push(...modifiedFirstElements);
      }
    });
    return dataArrays
  }*/
  /*async updatePropertiesFiltered(): Promise<void> {
    const propertyChainData = this.os.listItem.selectedBlankNodes;
    const formattedData = await this.parseRdfData(propertyChainData);
    const maxLength = this.getMaxLength(formattedData);
    const dataArrays = this.createArrays(maxLength);
    const propertyChainDataRes = this.processData(formattedData, dataArrays);

    if (propertyChainDataRes !== null) {
        this.propMap = this.os.listItem.objectPropertyMap.get(this.objectProp);
    }
  }*/

  formatAdditionalProperties(chains: string[]) {
    if (chains != null && chains.length > 0) {

      let formatString = "x";
      chains.forEach(p=> {
          formatString += ` '${p}' &nbsp<span class="blue-o">o</span>&nbsp`
      });
      formatString = formatString.substring(0, formatString.length - 34);
      formatString += `z => x  '${this.hasParent}' z`;

      return formatString;
    }
    return null;
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
            const data = this.formatAdditionalProperties(
                result.additionalProperties
            );

            if(data != null && data.length > 0) {
              const objData:string[] = this.os.listItem.objectPropertyMap.get(this.objectProp);
              if((data && data.length > 0)) {
                if (objData) {
                  this.os.listItem.objectPropertyMap.get(this.objectProp)?.push(data);
                } else {
                  this.os.listItem.objectPropertyMap.set(this.objectProp,[data]);
                }
              }
            }

            this.propMap = this.os.listItem.objectPropertyMap.get(this.objectProp);
          }
        });
  }

  openRemoveOverlay(propIndex: number, propValue: string) {
    this.dialog
        .open(ConfirmModalComponent, {
          data: {
            content: `<p>Are you sure you want to remove:<br><strong>${propValue}</strong>?</p>`,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const objMap = this.os.listItem.objectPropertyMap.get(this.objectProp);
            objMap.splice(propIndex, 1);
            this.os.listItem.objectPropertyMap.set(this.objectProp, objMap);
            this.propMap = objMap;
          }
        });
  }

  extractValues(inputString:string):string[]{
    const regex = /'(.*?)'(?=.*z\s*=>)/g;
    const extractValues:string[] = [];
    let match;

    while((match = regex.exec(inputString)) !== null){
        extractValues.push(match[1]);
    }
    return extractValues;
  }

  editClicked(index: number, property: string) {
    this.additional = [];
    const props = this.extractValues(property);
    console.log("PROPS",props);
    this.dialog
        .open(PropertyChainOverlayComponent, {
          data: {
            editing: true,
            additionalProperties: props,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const properties = this.os.listItem.objectPropertyMap.get(this.objectProp);
            properties[index] = this.formatAdditionalProperties(result.additionalProperties);
            this.os.listItem.objectPropertyMap.set(this.objectProp, properties);
          }
        });
  }
}
