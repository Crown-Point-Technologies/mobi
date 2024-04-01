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
import {Component, Inject, Input, OnInit} from '@angular/core';
import {Form, FormArray, FormControl, FormGroup, UntypedFormBuilder, Validators} from "@angular/forms";
import {OWL} from "../../../prefixes";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {PropertyOverlayDataOptions} from "../../../shared/models/propertyOverlayDataOptions.interface";
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {ToastService} from "../../../shared/services/toast.service";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {filter} from "lodash";
import {getMatIconNoHttpProviderError} from "@angular/material/icon";

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

  constructor(private fb:UntypedFormBuilder, private dialogRef: MatDialogRef<PropertyChainOverlayComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PropertyOverlayDataOptions, private os:OntologyStateService,
              private toast:ToastService,private pm: PropertyManagerService) {
    this.createForm();
  }

  ngOnInit(): void {
    this.getAllObjectProperties();
    if(this.data.additionalProperties) {
      const addProperties = this.propertyForm.get('additionalProperties') as FormArray;
      addProperties.clear();
      this.data.additionalProperties.forEach((property) => {
        addProperties.push(
            new FormControl(property,[Validators.required])
        );
      });

    }
    this.oldData = this.propertyForm.controls.additionalProperties.value;
  };

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
    const control = <FormArray>this.propertyForm.controls['additionalProperties'];
    control.removeAt(index);
  }

  getAllObjectProperties(){
    const objectPropertyList =
        this.os.listItem.flatEverythingTree?.filter((obj:any)=>
        Object.prototype.hasOwnProperty.call(obj, 'entityIRI'));
    this.objectProperties = objectPropertyList.map((obj:any) => obj.entityInfo?.label);
  }

  isFormValid():boolean{
    return (this.propertyForm.controls.additionalProperties.value.length >= 2
        && this.propertyForm.valid);
  }
  submit(){
    if(!this.data.editing){
      this.addPropertyChain();
    } else {
      this.editPropertyChain();
    }
    this.createForm();
  }

  addPropertyChain() {
    const newData = {
      additionalProperties: this.propertyForm.controls.additionalProperties.value,
    }
    const additionalProperties = this.propertyForm.controls.additionalProperties.value;
    this.createPropertyObj = additionalProperties;
    const propertyName = 'PropertyChainAxiom';
    const addedValues = filter(this.createPropertyObj, value => this.pm.addPropertyId(this.os.listItem.selected, propertyName, `${OWL}#${value}`));
    const valueObjs = addedValues.map(value => ({'@id': `${this.os.listItem.ontologyId}#${value}`}));

    const json: JSONLDObject = {
      '@id': this.os.listItem.selected['@id'],
      [`${OWL}PropertyChainAxiom`]: [{'@list': valueObjs}]
    };
    this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, json);
    this.os.saveCurrentChanges().subscribe();
    this.dialogRef.close(newData);
  }

  editPropertyChain() {
    if(this.data.additionalProperties && this.data.additionalProperties.length > 0)
    {
      this.editData = {
        additionalProperties: this.propertyForm.controls.additionalProperties.value
      }
    }

    const additionalProperties = this.propertyForm.controls.additionalProperties.value;
    const propertyName = 'PropertyChainAxiom';

    const addedOldValues = filter(this.oldData,oldValue=>this.pm.addPropertyId(this.os.listItem.selected,propertyName,`${OWL}#${oldValue}`));
    const addedValues = filter(additionalProperties, value => this.pm.addPropertyId(this.os.listItem.selected, propertyName, `${OWL}#${value}`));
    if (addedValues.length) {
      const oldValueObj = addedOldValues.map(oldValue=>({'@id':`${this.os.listItem.ontologyId}#${oldValue}`}));
      const valueObjs = addedValues.map(value => ({'@id': `${this.os.listItem.ontologyId}#${value}`}));
      this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, {
        '@id': this.os.listItem.selected['@id'],
        [`${OWL}PropertyChainAxiom`]: [{'@list': oldValueObj}]
      });
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {
        '@id': this.os.listItem.selected['@id'],
        [`${OWL}PropertyChainAxiom`]: [{'@list': valueObjs}]
      });
      this.os.saveCurrentChanges().subscribe();
      this.toast.createSuccessToast('Property Chain updated successfully');
      this.dialogRef.close(this.editData);
    }
  }

  protected readonly getMatIconNoHttpProviderError = getMatIconNoHttpProviderError;
}
