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
import { Component, OnInit } from '@angular/core';
import {UntypedFormBuilder, Validators} from "@angular/forms";
import {OntologyStateService} from "../../../../shared/services/ontologyState.service";
import {ToastService} from "../../../../shared/services/toast.service";
import {PropertyManagerService} from "../../../../shared/services/propertyManager.service";
import {MatDialogRef} from "@angular/material/dialog";
import {ObjectPropertyBlockComponent} from "../../objectPropertyBlock/objectPropertyBlock.component";
import {debounceTime, map, startWith} from "rxjs/operators";
import {cloneDeep} from "lodash";
import {createJson, getSkolemizedIRI} from "../../../../shared/utility";
import {Observable} from "rxjs";
import { OWL } from '../../../../prefixes';
import {JSONLDObject} from "../../../../shared/models/JSONLDObject.interface";

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
              private toast: ToastService,
              private pm: PropertyManagerService,
              private fb: UntypedFormBuilder,
              private dialogRef: MatDialogRef<ObjectPropertyBlockComponent>) {}

  ngOnInit(): void {
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
  addProperty(): void {
    const select = this.negativeObjectPropertyForm.controls.negativePropertySelect.value;
    const value = this.propertyValue[0];
    const genid = getSkolemizedIRI();
    const assertionPropValueObj = {'@id':select};
    const sourceIndiValueObj = {'@id':this.os.listItem.selected["@id"]}
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
    const types = this.os.listItem.selected['@type'];
    if (this.os.containsDerivedConcept(types) || this.os.containsDerivedConceptScheme(types)) {
      this.os.updateVocabularyHierarchies(select, [valueObj]);
    }
    this.dialogRef.close();
  }
  getName(val: string): string {
    return val ? this.os.getEntityNameByListItem(val) : '';
  }
}
