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
import {Observable} from 'rxjs';
import {UntypedFormControl} from '@angular/forms';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {OntologyManagerService} from '../../../shared/services/ontologyManager.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ToastService} from '../../../shared/services/toast.service';
import {ManchesterConverterService} from '../../../shared/services/manchesterConverter.service';
import {PropertyManagerService} from '../../../shared/services/propertyManager.service';
import {debounceTime, first, map, startWith} from 'rxjs/operators';
import {cloneDeep, filter, forEach, get, groupBy, has, intersection, isArray, some, sortBy} from 'lodash';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {RDFS} from '../../../prefixes';
import {splitIRI} from '../../../shared/pipes/splitIRI.pipe';
import { getIRILocalName, getIRINamespace } from '../../../shared/utility';

interface GeneralAxiomGroup {
  namespace: string,
  options: GeneralAxiomOption[]
}
interface GeneralAxiomOption {
  axiom: {iri: string, valuesKey: string},
  name: string
}

@Component({
  selector: 'app-general-class-axiom-overlay',
  templateUrl: './general-class-axiom-overlay.component.html',
  styleUrls: ['./general-class-axiom-overlay.component.scss']
})
export class GeneralClassAxiomOverlayComponent implements OnInit {

  errorMessage = '';
  axiom: {iri: string, valuesKey: string} = undefined;
  values: string[] = [];
  filteredAxioms: Observable<GeneralAxiomGroup[]>;
  expression = '';
  // tabIndex = 0;
  localNameMap = {};
  // valuesSelectList: {[key: string]: string} = {};
  editorOptions = {
    mode: 'text/omn',
    indentUnit: 4,
    lineWrapping: true,
    matchBrackets: true,
    readOnly: false,
    noNewlines: true,
    localNames: {}
  };

  axiomChoice = new UntypedFormControl('');

  constructor( private os: OntologyStateService, private om: OntologyManagerService,
               private dialogRef: MatDialogRef<GeneralClassAxiomOverlayComponent>, private toast: ToastService,
               private mc: ManchesterConverterService, private pm: PropertyManagerService,
               @Inject(MAT_DIALOG_DATA) public data: {axiomList: {iri: string, valuesKey: string}[]} ) {
  }

  ngOnInit(): void {
    this.localNameMap = this.createLocalNameMap();
    this.editorOptions.localNames = Object.keys(this.localNameMap);

    this.filteredAxioms = this.axiomChoice.valueChanges.pipe(
        debounceTime(500),
        startWith<string|{iri: string, valuesKey: string}>(''),
        map((value: string|{iri: string, valuesKey: string}) => {
          const searchText = typeof value === 'string' ?
              value :
              value ?
                  value.iri :
                  '';
          return this.filterAxioms(searchText);
        }),
    );
  }
  filterAxioms(searchText: string): GeneralAxiomGroup[] {
    if (!this.data.axiomList) {
      return [];
    }
    const filtered = this.data.axiomList
        .filter(axiom => axiom.iri.toLowerCase()
            .includes(searchText.toLowerCase()));
    const grouped: {[key: string]: {iri: string, valuesKey: string}[]} =
        groupBy(filtered, axiom => this.getIRINamespace(axiom));
    const rtn: GeneralAxiomGroup[] = Object.keys(grouped).map(namespace => ({
      namespace,
      options: grouped[namespace].map(axiom => ({
        axiom,
        name: this.getIRILocalName(axiom)
      }))
    }));
    rtn.forEach(group => {
      group.options = sortBy(group.options, option => this.getIRILocalName(option.axiom));
    });
    return rtn;
  }
  getIRINamespace(axiom: {iri: string, valuesKey: string}): string {
    return getIRINamespace(get(axiom, 'iri'));
  }
  getIRILocalName(axiom: {iri: string, valuesKey: string}): string {
    return getIRILocalName(get(axiom, 'iri'));
  }
  selectAxiom(event: MatAutocompleteSelectedEvent): void {
    const prevAxiom = this.axiom;
    this.axiom = event.option.value;
    this.values = [];
    this.setValues(prevAxiom);
    this.editorOptions.readOnly = false;
  }
  addAxiom(): void {
    const axiom = this.axiom.iri;
    let values;
    // Collect values depending on current tab
    // if (this.tabIndex === 1) {
      const usingDatatypeRange: boolean = (axiom === `${RDFS}range` && this.om.isDataTypeProperty(this.os.listItem.selected));
      const result = this.mc.manchesterToJsonld(this.expression, this.localNameMap, usingDatatypeRange);
      if (result.errorMessage) {
        this.errorMessage = result.errorMessage;
        return;
      } else if (result.jsonld.length === 0) {
        this.errorMessage = 'Expression resulted in no values. Please try again.';
        return;
      } else {
        const bnodeId = result.jsonld[0]['@id'];
        values = [bnodeId];
        forEach(result.jsonld, obj => {
          this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, obj);
          this.os.addEntity(obj);
          this.os.listItem.selectedBlankNodes.push(obj);
        });
        const bnodeIndex = this.os.getBnodeIndex(this.os.listItem.selectedBlankNodes);
        this.os.listItem.blankNodes[bnodeId] = this.mc.jsonldToManchester(bnodeId, this.os.listItem.selectedBlankNodes, bnodeIndex, true);
      }
    // }
    // else if (this.tabIndex === 0) {
    //   values = this.values;
    // }
    const addedValues = filter(values, value => this.pm.addId(this.os.listItem.selected, axiom, value));
    if (addedValues?.length !== values?.length) {
      this.toast.createWarningToast('Duplicate property values not allowed');
    }
    if (addedValues.length) {
      if (axiom === `${RDFS}range`) {
        this.os.updatePropertyIcon(this.os.listItem.selected);
      }
      const valueObjs = addedValues.map(value => ({'@id': value}));
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {'@id': this.os.listItem.selected['@id'], [axiom]: valueObjs});
      this.os.saveCurrentChanges().pipe(first())
          .subscribe(() => {
            this.os.listItem.selected = cloneDeep(this.os.listItem.selected); // Needed to trigger component input watchers
            let returnValues = [];
            // if (this.tabIndex === 0) {
              returnValues = intersection(values, addedValues);
            // }
            this.dialogRef.close({axiom: axiom, values: returnValues});
          });
    }
  }
  setValues(prevAxiom: {iri: string, valuesKey: string}): void {
    const valuesKey = get(this.axiom, 'valuesKey');
    // if (!valuesKey) {
    //   this.valuesSelectList = {};
    //   return;
    // }
    if (prevAxiom && prevAxiom.valuesKey === valuesKey) {
      return;
    }
    const array = Object.keys(has(this.os.listItem[valuesKey], 'iris') ? this.os.listItem[valuesKey].iris : this.os.listItem[valuesKey]);
    const filtered = this.removeIriFromArray(array, this.os.listItem.selected['@id']);
    // this.valuesSelectList = {};
    // filtered.forEach(iri => {
    //   this.valuesSelectList[iri] = getIRINamespace(iri);
    // });
  }
  removeIriFromArray(array: string [], removalIRI: string): string[] {
    let result = [''];

    function hasId(id, arr) {
      return some(arr, obj => id === get(obj, '@id'));
    }

    if (isArray(array) && array.length && removalIRI) {
      const removeIsArray = isArray(removalIRI);
      result = filter(array, iri => (removeIsArray && !hasId(iri, removalIRI)) || (!removeIsArray && removalIRI !== iri));
    } else if (!removalIRI) {
      result = result.concat(array);
    }

    return result;
  }

  private createLocalNameMap() {
    const map = {};
    this.os.listItem.iriList.forEach(iri => {
      map[splitIRI(iri).end] = iri;
    });
    return map;
  }

}
