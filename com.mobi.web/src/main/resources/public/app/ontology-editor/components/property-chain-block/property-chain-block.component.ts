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
import {DCTERMS, OWL, RDF, RDFS} from '../../../prefixes';
import {CatalogManagerService} from '../../../shared/services/catalogManager.service';

interface PropertyChainModel {
  genId:string,
  values:string[],
  formattedValuesStr:string
}
@Component({
  selector: 'property-chain-block',
  templateUrl: './property-chain-block.component.html',
  styleUrls: ['./property-chain-block.component.scss'],
})

export class PropertyChainBlockComponent implements OnInit, OnChanges {
  @Input() selected: JSONLDObject;
  additional: string[] = [];

  hasParent: string;
  objectProp:string | undefined;
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
    this.updatePropertyChainData();
  }

    async ngOnChanges() {
      this.oldHP = this.hasParent;
      this.objectProp  = this.om.getEntityName(this.os.listItem.selected);
      const selectedLabel = this.os.listItem.selected[`${RDFS}label`];
      const selectedAnnotationsLabel = selectedLabel?.[0]['@value'];
      const selectedProperty: string = this.os.listItem.selected[`${DCTERMS}title`];
      const selectedTitle = selectedProperty?.[0]['@value'];
      if(selectedTitle){
        this.hasParent = selectedTitle;
      } else if(selectedAnnotationsLabel){
        this.hasParent = selectedAnnotationsLabel;
      } else {
        this.hasParent = this.om.getEntityName(this.os.listItem.selected);
      }
        this.updateProperties();
  }

  updatePropertyChainData() {
    const selectedResponse:any = this.os.listItem.selected;
    const genids = this.extractGenids(selectedResponse);
    const response = this.os.listItem.selectedBlankNodes;
    const properties = (response && genids) ? this.extractRDFValues(response, genids) : [];

    for (const [key,value] of this.genidMap.entries()){
      const chainItem : PropertyChainModel= {
        genId: key,
        values: value,
        formattedValuesStr: this.formatAdditionalProperties(value)
      };
      this.propertyChainDatas.push(chainItem);
    }

    const newProperties:string[] = [];
    properties.forEach(data =>{
      newProperties.push(this.formatAdditionalProperties(data));
    });
    this.objectPropertyMap.set(this.objectProp,newProperties);
  }

  extractGenids(response: any[]): string[] {
    const genids = [];

    if (this.objectProp && response[`${OWL}propertyChainAxiom`]) {
        const propertyChainAxiom = response[`${OWL}propertyChainAxiom`];
        if (propertyChainAxiom && Array.isArray(propertyChainAxiom)) {
          propertyChainAxiom.forEach(item => {
            const genid = item['@id'];
            genids.push(genid);
          });
        }
      return genids;
    }
  }

  getLabelFromEntityIRI(entityIRI:string):string {
    const entry = this.os.listItem.objectProperties.flat.
    find(entry => entry.entityIRI === entityIRI);
    if(entry){
      return entry.entityInfo.label;
    }
  }
  extractRDFValues(linkedList: any[] , selectedGenId:any[]): any[][] {
    const result: any[][] = [];

    selectedGenId.forEach(selectedId => {
      const linkedListEntry = linkedList.find(node => node['@id'] === selectedId);
      if (linkedListEntry) {
        const values: string[] = [];
        let currentNode = linkedListEntry;

        while (currentNode) {
          const first = currentNode[`${RDF}first`];
          if (first){
            const firstId = first?.[0]['@id'];
            const value = this.getLabelFromEntityIRI(firstId);
            values.push(value);
          }
          currentNode = currentNode[`${RDF}rest`]
              ? linkedList.find(node => node['@id'] === currentNode[`${RDF}rest`][0]['@id'])
              : null;
        }

        const newGenid = selectedId;
        const properties = values;
        const chainItem : PropertyChainModel= {
          genId: newGenid,
          values: properties,
          formattedValuesStr: this.formatAdditionalProperties(properties)
        };
        this.propertyChainDatas.push(chainItem);

        result.push(values);
      }
    });
    return result;
  }

  updateProperties(){
      if(this.propertyChainDatas.length >0){
        this.propertyChainDatas.forEach(p=>{
          if(p.values){
           if(this.oldHP !== undefined) {
             p.values = p.values.map(str => (str === this.oldHP ? this.hasParent : str));
           }
            p.formattedValuesStr = this.formatAdditionalProperties(p.values);
          }
        });
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
    const selectedId = this.os.listItem.selected['@id'];

    if (response && Array.isArray(response)) {
      const genTempId = response.filter(m => m['@id'] === selectedId);
      genTempId.forEach((addition: any) => {
        if (addition[`${OWL}propertyChainAxiom`] &&
            Array.isArray(addition[`${OWL}propertyChainAxiom`])) {
          addition[`${OWL}propertyChainAxiom`].forEach((item: any) => {
            const genid = item['@id'];
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
              const properties = result.additionalProperties;

              const chainItem : PropertyChainModel= {
                genId: newGenid,
                values: properties,
                formattedValuesStr: this.formatAdditionalProperties(properties)
              };
              this.propertyChainDatas.push(chainItem);

            });

          }
        });
  }

  extractRemovePropertyChainValues(response, genId: string): JSONLDObject[] {
    const obj = response.find(obj => obj['@id'] === genId);

    if(!obj || obj[`${RDF}rest`]?.[0]['@id'] === `${RDF}nil`){
      return [];
    }

    const nextGenId = obj[`${RDF}rest`]?.[0]['@id'];
    const nextResponses = this.extractRemovePropertyChainValues(response,nextGenId);

     return[obj, ...nextResponses];
  }
  openRemoveOverlay(propIndex: number, propValue: string,removeGenId:string,removeValues:string[]) {
    this.dialog
        .open(ConfirmModalComponent, {
          data: {
            content: `<p>Are you sure you want to remove:<br><strong>${propValue}</strong>?</p>`,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const responseBlankNode= this.os.listItem.inProgressCommit.additions;
            const deletionObj:any[] = [];
            const deletedData :JSONLDObject[] =
                this.extractRemovePropertyChainValues(responseBlankNode,removeGenId);
            deletionObj.push(deletedData);

            const index = this.propertyChainDatas.
            findIndex(item => item.genId === removeGenId);
            if (index !== -1){
              this.propertyChainDatas.splice(index,1);
            }
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, {
              '@id': this.os.listItem.selected['@id'],'@type': [`${OWL}propertyChainAxiom`],
              [`${OWL}propertyChainAxiom`]: deletionObj
            });
            this.os.saveCurrentChanges().subscribe();
          }
        });
  }

  editClicked(index: number, property: string, removeGenId:string,values:string[]) {
    this.additional = [];
    this.dialog
        .open(PropertyChainOverlayComponent, {
          data: {
            editing: true,
            additionalProperties: values,
            genId: removeGenId,
            removeIndex: index
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const updateGenId = this.extractPropertyChainAxioms(this.os.listItem.additions);
            const updatedProperty = this.formatAdditionalProperties(result.additionalProperties);
            if (updatedProperty && updatedProperty.length > 0) {
              this.cm.getData.subscribe(data =>{
                this.propertyChainDatas[index].genId = this.extractPropertyChainAxioms(data.additions);
                this.propertyChainDatas[index].values = result.additionalProperties;
                this.propertyChainDatas[index].formattedValuesStr = updatedProperty;
              });
            }
          }
        });
  }

}
