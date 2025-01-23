/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Component, Input, SimpleChanges, OnChanges, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PropertyChainOverlayComponent } from '../property-chain-overlay/property-chain-overlay.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import {DCTERMS, OWL, RDF, RDFS} from '../../../prefixes';
import {CatalogManagerService} from '../../../shared/services/catalogManager.service';
import {PropertyManagerService} from '../../../shared/services/propertyManager.service';
import {cloneDeep, remove} from "lodash";
import {map, switchMap} from "rxjs/operators";
import {of} from "rxjs";

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
  propertyChainDatas:PropertyChainModel[]= [];
  oldHP:string;
  constructor(
      private dialog: MatDialog,
      public os: OntologyStateService,
      public om: OntologyManagerService,
      private cm : CatalogManagerService,
      private pm: PropertyManagerService
  ) { }

  async ngOnInit(){
    this.updatePropertyChainData();
    this.os.label$.subscribe(updateLabel =>{
      this.updateLabel();
    });
  }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes.selected && !changes.selected.firstChange) {
            this.updatePropertyChainData();  // Update property chain data when 'selected' changes
            this.updateProperties();          // Recalculate properties
        }
    }

  updatePropertyChainData() {
    const selectedResponse: any = this.os.listItem.selected;
    const genids = this.os.extractGenids(selectedResponse);
    const response = this.os.listItem.selectedBlankNodes;
    this.propertyChainDatas = [];
    if (response && genids) {
      this.extractRDFValues(response, genids);
    }
  }

  updateLabel(){
    this.oldHP = this.hasParent;
    this.objectProp  = this.om.getEntityName(this.os.listItem.selected);
    const selectedLabel = this.os.listItem.selected[`${RDFS}label`];
    const selectedAnnotationsLabel = selectedLabel?.[0]['@value'];
    const selectedProperty: string = this.os.listItem.selected[`${DCTERMS}title`];
    const selectedTitle = selectedProperty?.[0]['@value'];
    if (selectedAnnotationsLabel){
      this.hasParent = selectedAnnotationsLabel;
    } else if (selectedTitle){
      this.hasParent = selectedTitle;
    } else {
      this.hasParent = this.om.getEntityName(this.os.listItem.selected);
    }

    this.updateProperties();
  }

  getLabelFromEntityIRI(entityIRI:string):string {
    const entry = this.os.listItem.objectProperties.flat.
    find(entry => entry.entityIRI === entityIRI);
    if (entry){
      return entry?.entityInfo.label;
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
            const value =this.getLabelFromEntityIRI(firstId);
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
      if (this.propertyChainDatas.length >0){
        this.propertyChainDatas.forEach(p=>{
          if (p.values){
           if (this.oldHP !== undefined && this.oldHP !== this.hasParent) {
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
        .pipe(
            switchMap((result) => {
              if (result) {
                const properties = result.additionalProperties;
                return this.os.getEntity(this.os.listItem.selected['@id']).pipe(
                    map((data) => ({ data, properties })
                    )
                );
              } else {
                return of(null);
              }
            })
        )
        .subscribe(
            (response) => {
              if (response) {
                const { data, properties } = response;
                const newGenid = this.extractPropertyChainAxioms(data);

                const chainItem: PropertyChainModel = {
                  genId: newGenid,
                  values: properties,
                  formattedValuesStr: this.formatAdditionalProperties(properties),
                };

                this.propertyChainDatas.push(chainItem);
                this.pm.addPropertyId(this.os.listItem.selected, `${OWL}propertyChainAxiom`, newGenid);
              }
            },
            (error) => {
              console.error('Error fetching entity data:', error);
            }
        );
  }

openRemoveOverlay(propIndex: number, propValue: string, removeGenId: string, removeValues: string[], c: any) {
  this.dialog
      .open(ConfirmModalComponent, {
        data: {
          content: `<p>Are you sure you want to remove:<br><strong>${propValue}</strong>?</p>`,
        },
      })
      .afterClosed()
      .pipe(
          switchMap((result) => {
            if (result) {
              return this.os.getEntity(this.os.listItem.selected['@id']).pipe(
                  map((data) => {
                    const deletedData = this.os.extractRemovePropertyChainValues(data, removeGenId);
                    const deletionObj: any[] = [];
                    deletionObj.push(deletedData);

                    this.propertyChainDatas.splice(propIndex, 1);
                    this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, {
                      '@id': this.os.listItem.selected['@id'],
                      '@type': [`${OWL}propertyChainAxiom`],
                      [`${OWL}propertyChainAxiom`]: deletionObj,
                    });

                    this.os.isPreserve = false;
                    this.os.saveCurrentChanges().subscribe();
                  })
              );
            } else {
              return of(null);
            }
          })
      )
      .subscribe(
          () => {
            this.os.isPreserve = true;
          },
          (error) => {
            console.error("Error during the operation:", error);
            this.os.isPreserve = true;
          }
      );
}


editClicked(index: number, property: string, removeGenId: string, values: string[]): void {
    this.additional = [];

    this.dialog
        .open(PropertyChainOverlayComponent, {
            data: {
                editing: true,
                additionalProperties: values,
                genId: removeGenId,
                removeIndex: index,
            },
        })
        .afterClosed()
        .pipe(
            switchMap((result) => {
                if (result) {
                    const updatedProperties = result.additionalProperties;

                    // Get entity data using the selected ID from the OS service
                    return this.os.getEntity(this.os.listItem.selected['@id']).pipe(
                        map((data) => ({ data, updatedProperties }))
                    );
                } else {
                    return of(null);
                }
            })
        )
        .subscribe(
            (response) => {
                if (response) {
                    const { data, updatedProperties } = response;
                    const newGenId = this.extractPropertyChainAxioms(data);
                    const propertyData = this.propertyChainDatas[index];
                    propertyData.genId = newGenId;
                    propertyData.values = updatedProperties;
                    propertyData.formattedValuesStr = this.formatAdditionalProperties(updatedProperties);

                    this.pm.addPropertyId(this.os.listItem.selected, `${OWL}propertyChainAxiom`, newGenId);
                }
            },
            (error) => {
                console.error('Error fetching entity data:', error);
            }
        );
}

}
