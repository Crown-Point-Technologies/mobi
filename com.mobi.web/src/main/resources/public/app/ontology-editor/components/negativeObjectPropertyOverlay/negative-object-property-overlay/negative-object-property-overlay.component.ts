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
import {Component, Inject, OnInit} from '@angular/core';
import {UntypedFormBuilder, Validators} from "@angular/forms";
import {OntologyStateService} from "../../../../shared/services/ontologyState.service";
import {ToastService} from "../../../../shared/services/toast.service";
import {PropertyManagerService} from "../../../../shared/services/propertyManager.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ObjectPropertyBlockComponent} from "../../objectPropertyBlock/objectPropertyBlock.component";
import {debounceTime, map, startWith} from "rxjs/operators";
import {cloneDeep} from "lodash";
import {createJson, getSkolemizedIRI} from "../../../../shared/utility";
import {Observable} from "rxjs";
import { OWL } from '../../../../prefixes';
import {JSONLDObject} from "../../../../shared/models/JSONLDObject.interface";
import {PropertyOverlayDataOptions} from "../../../../shared/models/propertyOverlayDataOptions.interface";
import {NegativeObjectPropertyOptions} from "../../../../shared/models/negativeObjectProperty.interface";

interface PropGrouping {
  namespace: string,
  options: PropOption[]
}

interface PropOption {
  item: string,
  name: string
}

@Component({
  selector: 'app-negative-object-property-overlay',
  templateUrl: './negative-object-property-overlay.component.html',
  styleUrls: ['./negative-object-property-overlay.component.scss']
})
export class NegativeObjectPropertyOverlayComponent implements OnInit {
  individuals: {[key: string]: string} = {};
  objectProperties: string[] = [];
  filteredIriList: Observable<PropGrouping[]>;
  propertyValue: string[] = [];
  negativeObjectPropertyForm = this.fb.group({
    negativePropertySelect: ['', [Validators.required]],
  });

  constructor(public os:OntologyStateService,
              private fb: UntypedFormBuilder,
              private dialogRef: MatDialogRef<ObjectPropertyBlockComponent>,
              @Inject(MAT_DIALOG_DATA) public data: NegativeObjectPropertyOptions) {
  }

  ngOnInit(): void {
    if(this.data?.editing){
      this.negativeObjectPropertyForm.controls['negativePropertySelect'].
      setValue(this.data.prop[`${OWL}assertionProperty`][0]["@id"]);
      this.propertyValue[0] = this.data.prop[`${OWL}targetIndividual`][0]["@id"];
    }
    this.objectProperties = Object.keys(this.os.listItem.objectProperties.iris);
    this.filteredIriList = this.negativeObjectPropertyForm.controls.negativePropertySelect.valueChanges
        .pipe(
            debounceTime(500),
            startWith(''),
            map(val => this.filter(val || ''))
        );
    this.individuals = cloneDeep(this.os.listItem.individuals.iris);
    delete this.individuals[this.os.getActiveEntityIRI()];
  }
  filter(val: string): PropGrouping[] {
    if (!this.objectProperties || !this.objectProperties.length) {
      return [];
    }
    return this.os.getGroupedSelectList(this.objectProperties, val, iri => this.os.getEntityNameByListItem(iri));
  }

  onSubmit(){
    if(this.data?.editing){
      this.editProperty();
    } else {
      this.addProperty();
    }
  }
  addProperty(): void {
    const npValue = this.negativeObjectPropertyForm.controls.negativePropertySelect.value;
    const select = this.data?.editing ? (npValue === this.data.op ? this.data.op : npValue) : npValue;
    const value = this.data?.editing ? (this.propertyValue[0] === this.data.individual ? this.data.individual : this.propertyValue[0]) : this.propertyValue[0];
    const genid = getSkolemizedIRI();
    const assertionPropValueObj = {'@id':select};
    const sourceIndiValueObj = {'@id':this.os.listItem.selected["@id"]};
    const valueObj = {'@id': value};
    const payload:JSONLDObject = {
      '@id': genid,
      '@type':[`${OWL}NegativePropertyAssertion`],
      [`${OWL}assertionProperty`]: [assertionPropValueObj],
      [`${OWL}sourceIndividual`]: [sourceIndiValueObj],
      [`${OWL}targetIndividual`]: [valueObj],
    }
      this.os.addToAdditions(
          this.os.listItem.versionedRdfRecord.recordId,payload);
      this.os.saveCurrentChanges().subscribe();
    this.dialogRef.close();
  }

  editProperty(){
    this.os.addToDeletions(
        this.os.listItem.versionedRdfRecord.recordId,this.data.prop);
    this.addProperty();
  }
  getName(val: string): string {
    return val ? this.os.getEntityNameByListItem(val) : '';
  }
}
