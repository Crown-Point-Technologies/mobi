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
import {Component, Inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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
import {OWL, RDFS} from '../../../prefixes';
import {splitIRI} from '../../../shared/pipes/splitIRI.pipe';
import {getIRILocalName, getIRINamespace, getSkolemizedIRI} from '../../../shared/utility';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';

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
  values: string[] = [];
  filteredAxioms: Observable<GeneralAxiomGroup[]>;
  expression = '';
  localNameMap = {};
  action = '';
  gcaId= '';
  editorOptions = {
    mode: 'text/omn',
    indentUnit: 4,
    lineWrapping: true,
    matchBrackets: true,
    readOnly: false,
    noNewlines: true,
    localNames: {}
  };
  id='';
  gcaOthers = false;

  constructor( private os: OntologyStateService, private om: OntologyManagerService,
               private dialogRef: MatDialogRef<GeneralClassAxiomOverlayComponent>, private toast: ToastService,
               private mc: ManchesterConverterService, private pm: PropertyManagerService,
               @Inject(MAT_DIALOG_DATA) public data: {generalClassAxiomList: {iri: string, valuesKey: string}[], exp: string, action: string, id:string}) {
    this.action = data.action;
    this.expression = data.exp === null ? this.expression : data.exp;
    this.id = data.id;
  }

  ngOnInit(): void {
    this.localNameMap = this.createLocalNameMap();
    this.editorOptions.localNames = Object.keys(this.localNameMap);
  }

  addAxiom(): void {
    if (this.action === 'edit') {
      delete this.os.listItem.blankNodes[this.id];
      const newGCAObj = {'@id': this.id};
      if (this.os.listItem.gcaOthers.some(obj=>
          Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))){
        const data = this.os.listItem.gcaOthers.
        find(g=>g['@id']===this.id);
        const index = this.os.listItem.gcaOthers.indexOf(data);
        this.os.listItem.gcaOthers.splice(index,1);
      }
      if (this.os.listItem.generalClassAxiom.some(obj=>
          Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))){
        const data = this.os.listItem.generalClassAxiom.
        find(g=>g['@id']===this.id);
        const index = this.os.listItem.generalClassAxiom.indexOf(data);
        this.os.listItem.generalClassAxiom.splice(index,1);
      }
      if (this.os.listItem.generalClassAxioms.some(obj=>
          Object.values(obj).some (val => Object.values(newGCAObj).includes(val)))){
        const data = this.os.listItem.generalClassAxioms.
        find(g=>g['@id']===this.id);
        const index = this.os.listItem.generalClassAxioms.indexOf(data);
        this.os.listItem.generalClassAxioms.splice(index,1);
      }
      const deleteGCAsObj =
          this.findRelatedObjects(this.os.listItem.selectedBlankNodes, this.id);
      for ( const obj of deleteGCAsObj) {
        this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, obj);
        // this.os.listItem.selectedBlankNodes[obj];
      }
    }
    let values;
    const result = this.mc.manchesterToJsonld(this.expression, this.localNameMap, false);
      if (result.errorMessage) {
        this.errorMessage = result.errorMessage;
        return;
      } else if (result.jsonld.length === 0) {
        this.errorMessage = 'Expression resulted in no values. Please try again.';
        return;
      } else {

        const gcaIRI = this.extractAfterSubClassOf();
        const keyword:boolean = this.hasMoreThanOneIRI(gcaIRI);
        if (keyword){
        this.gcaId = getSkolemizedIRI();
        const res = this.getGCAPayload(this.gcaId, gcaIRI);
          result.jsonld.push(res);
        this.gcaOthers = true;
        }
        const bnodeId = result.jsonld[0]['@id'];
        const modifyFirstObj = this.insertSubClassOf(result.jsonld[0]);
        result.jsonld[0] = modifyFirstObj;
        values = bnodeId;
        forEach(result.jsonld, obj => {
          this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, obj);
          this.os.addEntity(obj);
          this.os.listItem.selectedBlankNodes.push(obj);
        });
        const bnodeIndex =
            this.os.getBnodeIndex(this.os.listItem.selectedBlankNodes);
        const gcaResponse =  this.mc.gcaJsonldToManchester(bnodeId, this.os.listItem.selectedBlankNodes, bnodeIndex, true);
          this.os.listItem.blankNodes[bnodeId] = gcaResponse;
      }
      const valueObjs:JSONLDObject = {'@id': values};
      if (!this.os.listItem.generalClassAxiom.some(obj=>
          Object.values(obj).some(val => Object.values(valueObjs).includes(val)))) {
        this.os.listItem.generalClassAxioms.push(valueObjs);
        if (!this.gcaOthers){
          this.os.listItem.generalClassAxiom.push(valueObjs);
        }
        this.os.listItem.gcaOthers?.push(valueObjs);
        this.gcaOthers = false;
      } else {
        this.toast.createWarningToast('Duplicate property values not allowed');
      }
      this.os.saveCurrentChanges().pipe(first())
          .subscribe(() => {
            this.dialogRef.close({gca: 'gca', values: values});
          });
  }

  findRelatedObjects(selectedBlankNode:  JSONLDObject[], genid: string):  JSONLDObject[] {
    const result: JSONLDObject[]  = [];

    const lookup: { [id: string]:  JSONLDObject } = {};
    selectedBlankNode.forEach(node => {
      lookup[node['@id']] = node;
    });

    const findRelated = (nodeId: string)=> {
      if (lookup[nodeId] && !result.includes(lookup[nodeId])) {
        result.push(lookup[nodeId]);
        const node = lookup[nodeId];
        for (const key in node) {
          if (key.startsWith('http://') && Array.isArray(node[key])) {
            node[key].forEach((item: any) => {
              if (item['@id']) {
                findRelated(item['@id']);
              }
            });
          }
        }
      }
    };

    findRelated(genid);

    return result;
  }
  extractAfterSubClassOf(){
    let result = '';
    const keyword = 'SubClassOf';
    const index = this.expression.indexOf(keyword);

    if (index !== -1){
      result = this.expression.substring(index + keyword.length).trim();
    }
    return result;
  }

  hasMoreThanOneIRI(iri:string):boolean{
    const words = iri.trim().split(/\s+/);
    return words.length > 1;
  }
    getEntityName(entity: string): string {
      return `https://spec.industrialontologies.org/ontology/core/Core/${entity}`;
    }

  getGCAPayload(id:string, str:string){
    const OWL = 'http://www.w3.org/2002/07/owl#';
    const expressionKeywords = {
      [`${OWL}unionOf`]: ' or ', // A or B
      [`${OWL}intersectionOf`]: ' and ', // A and B
      [`${OWL}complementOf`]: 'not ', // not A
      [`${OWL}oneOf`]: ', ', // {a1 a2 ... an}.
    };
      let keyword = '';
      let entities = [];

      const [firstEntity, operator, secondEntity] = str.split(/(and | or |not |, )/).map(part => part.trim());
      if (!firstEntity || !secondEntity || !operator){
        throw new Error('Invalid subClass IRI');
      }

      entities = [this.getEntityName(firstEntity), this.getEntityName(secondEntity)];
      keyword = Object.keys(expressionKeywords).find(key => expressionKeywords[key].trim() === operator);

      // for (const [key, value] of Object.entries(expressionKeywords)) {
      //   if (str.includes(value.trim())) {
      //     keyword = key;
      //     entities = str.split(value.trim()).map(this.getEntityName);
      //     break;
      //   }
      // }

      if (!keyword) {
        throw new Error(`No matching keyword found for input string: ${str}`);
      }

      return {
        '@id': id,
        '@type': [
          `${OWL}Class`
        ],
        [keyword]: [
          {
            '@list': entities.map(entity => ({
              '@id': entity
            }))
          }
        ]
      };
    }

  insertSubClassOf(jsonObj){
    let subClass = '';
    if (this.gcaId){
      subClass = this.gcaId;
    } else {
      subClass = this.os.listItem.selected['@id'];
    }
    // const isProject = localStorage.getItem("projectTab");
    // if(isProject == "yes") {
    //   localStorage.removeItem("projectTab");
    //   subClass = this.expression.split("SubClassOf ")[1];
    //   if(subClass.startsWith("(") && subClass.endsWith(")")) {
    //     const data = subClass.substring(1, subClass.length - 1).split(" or ");
    //     subClass = "";
    //     data.forEach(d=> {
    //       subClass += "https://spec.industrialontologies.org/ontology/core/Core/"+d+" or ";
    //     });
    //     subClass = subClass.substring(0, subClass.lastIndexOf(" or "));
    //   } else {
    //     subClass = "https://spec.industrialontologies.org/ontology/core/Core/"+subClass;
    //   }
    //   /*if(subClass) {
    //     const data = subClass.split(" ");
    //     data.forEach(d=> {
    //       subClass = "https://spec.industrialontologies.org/ontology/core/Core/"+d+" ";
    //     });
    //   }*/
    // }
    if ((subClass !== this.os.listItem.ontologyId ) && !jsonObj[`${RDFS}subClassOf`]){
      const subClassOf = {
        'http://www.w3.org/2000/01/rdf-schema#subClassOf': [
          {
            '@id': subClass
          }
        ]
      };

      // Convert the JSON object to an array of key-value pairs
      const entries = Object.entries(jsonObj);

      //Find the index of the "@type" key
      const typeIndex = entries.findIndex(entry => entry[0] === '@type');

      //Insert the subClassOf section after the "@type" key
      entries.splice(typeIndex + 1, 0, ...Object.entries(subClassOf));

      // Convert the entries back to a JSON object
      const newObj = {};
      for (const [key,value] of entries){
        newObj[key] = value;
      }
      return newObj;
    }
    console.log('TESSST jsonObj',jsonObj);
    return jsonObj;
  }

  // processSubClass(genId:string,result:string,):string {
  //   let resultStr = result.trim();
  //   let sc;
  //   for (const obj of this.os.listItem.selectedBlankNodes) {
  //     if (obj['@id'] && obj['@id'] === genId) {
  //       sc =  obj['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0];
  //     }
  //   }
  //   const subClass = this.om.getEntityName({'@id':sc['@id']});
  //   resultStr += ` subClassOf ${subClass}`;
  //   return resultStr;
  // }

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
