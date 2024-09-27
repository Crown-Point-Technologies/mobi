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
import {Observable} from "rxjs";
import {UntypedFormBuilder, Validators} from "@angular/forms";
import {datatype} from "../../../shared/validators/datatype.validator";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {ToastService} from "../../../shared/services/toast.service";
import {map, startWith} from "rxjs/operators";
import {createJson, getSkolemizedIRI} from "../../../shared/utility";
import {cloneDeep} from "lodash";
import {OWL, RDF, XSD} from "../../../prefixes";
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";

interface PropGrouping {
  namespace: string,
  options: PropOption[]
}

interface PropOption {
  item: string,
  name: string
}

@Component({
  selector: 'app-negative-data-property-overlay',
  templateUrl: './negative-data-property-overlay.component.html',
  styleUrls: ['./negative-data-property-overlay.component.scss']
})
export class NegativeDataPropertyOverlayComponent implements OnInit {
  dataProperties: string[] = [];
  dataPropertiesFiltered: Observable<PropGrouping[]>;
  propertyType: string[] = []; // Array but only expect one value
  propertyForm = this.fb.group({
    propertySelect: ['', Validators.required],
    propertyValue: ['', [Validators.required, datatype(() => this.propertyType[0])]],
    language: ['']
  })

  constructor(private dialogRef: MatDialogRef<NegativeDataPropertyOverlayComponent>,
              public os: OntologyStateService,
              private pm: PropertyManagerService,
              private fb: UntypedFormBuilder,
              private toast: ToastService,
              @Inject(MAT_DIALOG_DATA) public data: { editingProperty: boolean,
                propertySelect: string,
                propertyValue: string,
                propertyType: string,
                propertyIndex: number,
                propertyLanguage: string
              }) {}

  ngOnInit(): void {
    this.dataProperties = Object.keys(this.os.listItem.dataProperties.iris);
    this.dataPropertiesFiltered =  this.propertyForm.controls.propertySelect.valueChanges.pipe(
        startWith(''),
        map(value => this.filter(value || ''))
    );

  }
  filter(val: string): PropGrouping[] {
    if (!this.dataProperties || !this.dataProperties.length) {
      return [];
    }
    return this.os.getGroupedSelectList(this.dataProperties, val, iri => this.os.getEntityNameByListItem(iri));
  }
  submit(): void {
      this.addProperty();
  }
  addProperty (): void {
    const selectedValue = this.propertyForm.controls.propertySelect.value;
    const propertyValue = this.propertyForm.controls.propertyValue.value;
    const lang = this.getLang(this.propertyForm.controls.language.value);
    const realType = this.getType(lang, this.propertyType[0]);
    const assertionPropValueObj =  {'@id':selectedValue};
    const sourceIndiValueObj = {'@id':this.os.listItem.selected["@id"]}
    const valueObj = this.pm.createValueObj(propertyValue, realType, lang)
    const genid = getSkolemizedIRI();

    const payload:JSONLDObject = {
      '@id': genid,
      '@type':[`${OWL}NegativePropertyAssertion`],
      [`${OWL}assertionProperty`]: [assertionPropValueObj],
      [`${OWL}sourceIndividual`]: [sourceIndiValueObj],
      [`${OWL}targetValue`]: [valueObj],
    }
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId,payload);
      this.os.saveCurrentChanges().subscribe();
    this.dialogRef.close();
  }
  isLangString(): boolean {
    return `${RDF}langString` === (this.propertyType ? this.propertyType[0]: '');
  }
  getLang(language: string): string {
    return language && this.isLangString() ? language : '';
  }
  getType(language: string, type: string):string {
    return language ? '' : type || `${XSD}string`;
  }
  getName(val: string): string {
    return val ? this.os.getEntityNameByListItem(val) : '';
  }
  validateValue(newValue: string[]): void {
    this.propertyType = newValue;
    this.propertyForm.controls.propertyValue.updateValueAndValidity();
  }
}
