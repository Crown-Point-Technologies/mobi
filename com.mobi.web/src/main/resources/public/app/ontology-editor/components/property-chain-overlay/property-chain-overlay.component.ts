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
import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {OWL} from '../../../prefixes';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {PropertyOverlayDataOptions} from '../../../shared/models/propertyOverlayDataOptions.interface';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {ToastService} from '../../../shared/services/toast.service';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';
import {PropertyManagerService} from '../../../shared/services/propertyManager.service';
import {cloneDeep, filter, intersection} from 'lodash';
import {first} from 'rxjs/operators';
import {CatalogManagerService} from "../../../shared/services/catalogManager.service";

@Component({
  selector: 'app-property-chain-overlay',
  templateUrl: './property-chain-overlay.component.html',
  styleUrls: ['./property-chain-overlay.component.scss']
})
export class PropertyChainOverlayComponent implements OnInit {
  @Input()
  propertyForm:FormGroup;
  objectProperties:string[];
  editData = {};
  createPropertyObj = [];
  propertyMap:Map<number, string[]> = new Map();
  expression = '';
  localNameMap = {};
  oldData:string[];

  constructor(private dialogRef: MatDialogRef<PropertyChainOverlayComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PropertyOverlayDataOptions, private os:OntologyStateService,
              private toast:ToastService,  private cm : CatalogManagerService) {
    this.createForm();
  }

  ngOnInit(): void {
    this.getAllObjectProperties();
    if (this.data.additionalProperties) {
      const addProperties = this.propertyForm.get('additionalProperties') as FormArray;
      addProperties.clear();
      this.data.additionalProperties.forEach((property) => {
        addProperties.push(
            new FormControl(property,[Validators.required])
        );
      });

    }
    this.oldData = this.propertyForm.controls.additionalProperties.value;
  }

  createForm(){
  this.propertyForm = new FormGroup({
    additionalProperties: new FormArray([
      new FormControl('',[Validators.required]),
      new FormControl('',[Validators.required]),
    ]),
  });
  }

  addProperty(){
    const control = this.propertyForm.get('additionalProperties') as FormArray;
    control.push(
        new FormControl('',[Validators.required])
    );
  }

  removeProperty(index:number){
    const control = <FormArray> this.propertyForm.controls['additionalProperties'];
    control.removeAt(index);
  }

  getAllObjectProperties(){
    const objectPropertyList =
        this.os.listItem.objectProperties.flat?.filter((obj:any)=>
            Object.prototype.hasOwnProperty.call(obj, 'entityIRI'));
    this.objectProperties = objectPropertyList.map((obj:any) => obj.entityInfo?.label);

  }

  isFormValid():boolean{
    return (this.propertyForm.controls.additionalProperties.value.length >= 2
        && this.propertyForm.valid);
  }
  submit(){
    if (!this.data.editing){
      this.addPropertyChain();
    } else {
      this.editPropertyChain();
    }
    this.createForm();
  }

  addPropertyChain() {
    const newData = {
      additionalProperties: this.propertyForm.controls.additionalProperties.value,
    };
    const additionalProperties = this.propertyForm.controls.additionalProperties.value;
    this.createPropertyObj = additionalProperties;
    const propertyName = `${OWL}propertyChainAxiom`;
    const valueObjs = additionalProperties.map(value =>
        ({'@id': this.os.getEntityIRIFromLabel(value)}));
    const json: JSONLDObject = {
      '@id': this.os.listItem.selected['@id'],
      [propertyName]: [{'@list': valueObjs}]
    };
    this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, json);
    this.os.isPreserve = false;
    this.os.saveCurrentChanges().subscribe();
    this.os.isPreserve = true;
    this.os.setEntityUsages(this.os.listItem.selected['@id']);
    this.os.getEntity(this.os.listItem.selected['@id']).subscribe();
    this.os.setEntityUsages(this.os.listItem.selected['@id']);
    this.dialogRef.close(newData);
  }

  editPropertyChain() {
    const response:JSONLDObject = this.os.listItem.selected;
    const deletionObj:any[] = [];
    const responseBlankNode= this.os.listItem.inProgressCommit.additions;
    const responseSelectedBlankNode= this.os.listItem.selectedBlankNodes;
    let deleteBNode:any;
    if(responseSelectedBlankNode?.length > 0){
      deleteBNode = responseSelectedBlankNode;
    } else {
      deleteBNode = responseBlankNode;
    }
    const removeGenId = this.data.genId;
    const propIndex = this.data.removeIndex;
    const deletedData :JSONLDObject[] = this.os.extractRemovePropertyChainValues(deleteBNode,removeGenId);
    deletionObj.push(deletedData);

    if (response[`${OWL}propertyChainAxiom`]) {
      const propertyChainAxiom = response[`${OWL}propertyChainAxiom`];
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
      '@id': this.os.listItem.selected['@id'],'@type': [`${OWL}propertyChainAxiom`],
      [`${OWL}propertyChainAxiom`]: deletionObj
    });
    if (this.data.additionalProperties && this.data.additionalProperties.length > 0) {
      this.editData = {
        additionalProperties: this.propertyForm.controls.additionalProperties.value
      };
    }

    const additionalProperties = this.propertyForm.controls.additionalProperties.value;
      const valueObjs = additionalProperties.map(value =>
          ({'@id': this.os.getEntityIRIFromLabel(value)}));

      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {
        '@id': this.os.listItem.selected['@id'],
        [`${OWL}propertyChainAxiom`]: [{'@list': valueObjs}]
      });
      this.os.isPreserve = false;
      this.os.saveCurrentChanges().subscribe();
      this.os.isPreserve = true;
    this.os.setEntityUsages(this.os.listItem.selected['@id']);
      this.os.getEntity(this.os.listItem.selected['@id']).subscribe();
      this.os.setEntityUsages(this.os.listItem.selected['@id']);
    this.toast.createSuccessToast('Property Chain updated successfully');
      this.dialogRef.close(this.editData);
  }

}
