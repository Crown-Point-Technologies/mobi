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
import {Component, Inject, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ToastService} from "../../../shared/services/toast.service";
import {ManchesterConverterService} from "../../../shared/services/manchesterConverter.service";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {debounceTime, first, map, startWith} from "rxjs/operators";
import {cloneDeep, filter, forEach, get, groupBy, has, intersection, isArray, some, sortBy} from "lodash";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {OWL, RDFS} from "../../../prefixes";
import {splitIRI} from "../../../shared/pipes/splitIRI.pipe";
import { getIRILocalName, getIRINamespace } from '../../../shared/utility';
import {JSONLDObject} from "../../../shared/models/JSONLDObject.interface";

@Component({
  selector: 'app-types-overlay',
  templateUrl: './types-overlay.component.html',
  styleUrls: ['./types-overlay.component.scss']
})
export class TypesOverlayComponent implements OnInit {
  errorMessage = '';
  axiom: {iri: string, valuesKey: string} = undefined;
  values: string[] = [];
  expression = '';
  tabIndex = 0;
  localNameMap = {};
  localNameMapforLabel = {};
  valuesSelectList: {[key: string]: string} = {};
  editorOptions = {
    mode: 'text/omn',
    indentUnit: 4,
    lineWrapping: true,
    matchBrackets: true,
    readOnly: false,
    noNewlines: true,
    localNames: {}
  };
  types = [];
  namedIndividualIri = `${OWL}NamedIndividual`;
  constructor( private os: OntologyStateService,
               private dialogRef: MatDialogRef<TypesOverlayComponent>,
               private mc: ManchesterConverterService,
               @Inject(MAT_DIALOG_DATA) public data: {axiomList: {iri: string, valuesKey: string}[]} ) {
  }

  ngOnInit(): void {
    this.localNameMap = this.createLocalNameMap();
    this.localNameMapforLabel = this.createLocalNameMapForLabel();
    this.editorOptions.localNames = Object.keys(this.localNameMap);
  }
  getIRINamespace(axiom: {iri: string, valuesKey: string}): string {
    return getIRINamespace(get(axiom, 'iri'));
  }
  getIRILocalName(axiom: {iri: string, valuesKey: string}): string {
    return getIRILocalName(get(axiom, 'iri'));
  }
  addType(): void {
    let values;
    if (this.tabIndex === 1) {
      const usingDatatypeRange = false;
      this.expression = this.modifyExpressionWithUrlExtraction(this.localNameMapforLabel,this.expression);
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
    } else if (this.tabIndex === 0) {
      values = this.types;
    }

      const payload:JSONLDObject = {
        '@id': this.os.listItem.selected['@id'],
        '@type':values
      }
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, payload);
      this.os.saveCurrentChanges().pipe(first())
          .subscribe(() => {
            this.os.listItem.selected = cloneDeep(this.os.listItem.selected); // Needed to trigger component input watchers
            this.dialogRef.close();
          });
  }

  modifyExpressionWithUrlExtraction(map: { [key: string]: string }, s: string): string {
    const restrictedKeywords = ["and","or", "(", ")", "SubClassOf", "some"];
    const words = s.split(/\s+/);
    let result = '';
    let currentSegment='';

    for(let i=0; i<words.length;i++){
      let word = words[i];
      if(restrictedKeywords.includes(word)){
        if(currentSegment.length > 0){
          if(map[currentSegment]){
            result += splitIRI(map[currentSegment]).end + ' ';
          } else {
            result += currentSegment + ' ';
          }
          currentSegment = '';
        }
        result += word + ' ';
      } else {
        if(currentSegment.length > 0){
          currentSegment += ' ';
        }
        currentSegment += word;
      }
    }

    if(currentSegment.length > 0) {
      if(map[currentSegment]) {
        result += splitIRI(map[currentSegment]).end;
      } else {
        result += currentSegment;
      }
    }

    return result.trim();
  }

  getLabelByIRI(iri:string){
    return this.os.listItem.entityInfo[iri]?.label;
  }

  private createLocalNameMap() {
    const map = {};
    this.os.listItem.iriList.forEach(iri => {
      map[splitIRI(iri).end] = iri;
    });
    return map;
  }

  private createLocalNameMapForLabel() {
    const map = {};
    this.os.listItem.iriList.forEach(iri => {
      map[this.getLabelByIRI(iri)] = iri;
    });
    return map;
  }
}
