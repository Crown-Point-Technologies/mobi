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
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ManchesterConverterService} from '../../../shared/services/manchesterConverter.service';
import {forEach} from 'lodash';
import {RDFS} from '../../../prefixes';
import {splitIRI} from '../../../shared/pipes/splitIRI.pipe';
import { getSkolemizedIRI} from '../../../shared/utility';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';
import {SharedDataManagerService} from "../../../shared/services/shared-data-manager.service";

@Component({
  selector: 'app-general-class-axiom-overlay',
  templateUrl: './general-class-axiom-overlay.component.html',
  styleUrls: ['./general-class-axiom-overlay.component.scss']
})
export class GeneralClassAxiomOverlayComponent implements OnInit {
  errorMessage = '';
  values: string[] = [];
  expression = '';
  localNameMap = {};
  localNameMapForLabel = {};
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
  gcaIRI = '';

  constructor( private os: OntologyStateService,
               private dialogRef: MatDialogRef<GeneralClassAxiomOverlayComponent>,
               private mc: ManchesterConverterService, private sdm:SharedDataManagerService,
               @Inject(MAT_DIALOG_DATA) public data: {generalClassAxiomList: {iri: string, valuesKey: string}[], exp: string, action: string, id:string}) {
    this.action = data.action;
    this.expression = data.exp === null ? this.expression : data.exp;
    this.id = data.id;
  }

  ngOnInit(): void {
    this.localNameMap = this.createLocalNameMap();
    this.localNameMapForLabel = this.createLocalNameMapForLabel();
    this.editorOptions.localNames = Object.keys(this.localNameMap);
  }

  addAxiom(): void {
    this.sdm.getUpdatedLabelsIRI(this.os.listItem);
    if (this.action === 'edit') {
      delete this.os.listItem.blankNodes[this.id];
      const deleteGCAsObj =
          this.findRelatedObjects(this.os.listItem.selectedBlankNodes, this.id);
      for ( const obj of deleteGCAsObj) {
        this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, obj);
        this.os.listItem.selectedBlankNodes = this.os.listItem.selectedBlankNodes.filter(s=>s['@id'] !== obj['@id']);
      }
    }
    let values;
    let labelExpression;
    labelExpression = this.expression;
    this.expression = this.modifyExpressionWithUrlExtraction(this.localNameMapForLabel, this.expression);
    this.gcaIRI = this.extractAfterSubClassOf();
    const result = this.mc.manchesterToJsonld(this.expression, this.localNameMap, false);
    const validExpression = this.validateString(labelExpression, this.localNameMapForLabel);
    if (result.errorMessage) {
      this.expression = labelExpression;
      this.errorMessage = result.errorMessage;
      return;
    } else if (result.jsonld.length === 0) {
      this.expression = labelExpression;
      this.errorMessage = 'Expression resulted in no values. Please try again.';
      return;
    }
    else if(validExpression[0]){
      this.expression = labelExpression;
      this.errorMessage = validExpression[0];
      return;
    }
    else {
      const keyword:boolean = this.hasMoreThanOneIRI(this.gcaIRI);
      if (keyword){
        this.gcaId = getSkolemizedIRI();
        const res = this.getGCAPayload(this.gcaId, this.gcaIRI);
        result.jsonld.push(res);
        this.gcaOthers = true;
      }
      const bnodeId = result.jsonld[0]['@id'];
      const modifyFirstObj = this.insertSubClassOf(result.jsonld[0]);
      result.jsonld[0] = modifyFirstObj;
      values = bnodeId;
      forEach(result.jsonld, obj => {
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, obj);
        this.os.listItem.selectedBlankNodes.push(obj);
      });
      const bnodeIndex = this.os.getBnodeIndex(this.os.listItem.selectedBlankNodes);
      this.os.listItem.blankNodes[bnodeId] = this.mc.gcaJsonldToManchester(bnodeId, this.os.listItem.selectedBlankNodes, bnodeIndex, true);
    }
    this.os.saveCurrentChanges()
        .subscribe(() => {
          this.dialogRef.close({gca: 'gca', values: values});
        });
  }

  _getFullIRI(ctx: string) {
    const localName = ctx;
    const iri = this.localNameMap[localName];
    return iri;
  }

  validateString(s: string, iriMap: { [key: string]: string }): [string | null, boolean] {
    const restrictKeywords = ['and', 'or', 'not', '(', ')'];

    // Find the index of "SubClassOf"
    const subClassOfIndex = s.indexOf("SubClassOf");

    // If "SubClassOf" is not present, return an error
    if (subClassOfIndex === -1) {
      return ["Mismatched input 'SubClassOf' expecting 'SubClassOf'", false];
    }

    // Get the string after "SubClassOf"
    const afterSubClassOf = s.substring(subClassOfIndex + "SubClassOf".length).trim();

    // Split the string into words
    const words = afterSubClassOf.split(/\s+/);
    let result = '';
    let validExpression = true;

    // Iterate over words
    for (let i = 0; i < words.length; i++) {
      let word = words[i];

      // Skip restriction keywords, do not add them to the result
      if (restrictKeywords.includes(word)) {
        // If it's a restriction keyword, check the current result (if any)
        if (result.trim() && !iriMap[result.trim()]) {
          validExpression = false;
          return [`${result.trim()} is not correspond to a known IRI`, true];
        }
        result = ''; // Reset result after a restriction keyword
        continue; // Skip to the next word
      }

      // Add the word to the result
      result += word + ' ';

      // Check if the next word is a restriction keyword or it's the last word
      const isLastWord = (i === words.length - 1);
      const isRestrictionKeyword = restrictKeywords.includes(words[i + 1]);

      // If it's the last word or a restriction keyword, check the result against the map
      if (isLastWord || isRestrictionKeyword) {
        if (!iriMap[result.trim()]) {
          validExpression = false;
          return [`${result.trim()} is not correspond to a known IRI`, true];
        }

        // Reset result for the next part after checking
        result = '';
      }
    }

    // If all parts are found in the map, return null
    if (validExpression) {
      return [null, false];
    }

    return ["Unexpected error", false];
  }



  // validateString(s: string, iriMap:{ [key: string]: string }): string | null {
  //   const restrictKeywords = ['and', 'or', 'not', '(', ')'];
  //
  //   const subClassOfIndex = s.indexOf("SubClassOf");
  //
  //   if (subClassOfIndex === -1){
  //     return "Mismatched input 'SubClassOf' expecting 'SubClassOf'";
  //   }
  //
  //   const afterSubClassOf = s.substring(subClassOfIndex + "SubClassOf".length).trim();
  //
  //   const words = afterSubClassOf.split(/\s+/);
  //   let result = '';
  //   let length = words.length;
  //   for (let word of words) {
  //     if (restrictKeywords[word]) {
  //       break;
  //     } else {
  //       result += word + ' ';
  //     }
  //
  //     if (!iriMap[result]) {
  //       return `${result} is not correspond to a known IRI`;
  //     }
  //
  //   }
  //
  //   return null;
  // }

  modifyExpressionWithUrlExtraction(map: { [key: string]: string }, s: string): string {
    const restrictedKeywords = ["and","or", "(", ")", "SubClassOf", "some"];
    const words = s.split(/(\s+|\(|\)|\b)/).filter(word => word.trim().length > 0);
    let result = '';
    let currentSegment ='';

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
    // if (!firstEntity || !secondEntity || !operator){
    //   this.errorMessage = 'Invalid subClass IRI. It does not correspond to a known IRI.';
    // }

    entities = [this._getFullIRI(firstEntity), this._getFullIRI(secondEntity)];
    keyword = Object.keys(expressionKeywords).find(key => expressionKeywords[key].trim() === operator);

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

  insertSubClassOf(jsonObj:any){
    let subClass = '';
    if (this.gcaId){
      subClass = this.gcaId;
    } else {
      subClass = this._getFullIRI(this.gcaIRI);
    }

    if ((subClass !== this.os.listItem.ontologyId ) && !jsonObj[`${RDFS}subClassOf`]){
      const subClassOf = {
        'http://www.w3.org/2000/01/rdf-schema#subClassOf': [
          {
            '@id': subClass
          }
        ]
      };

      const entries = Object.entries(jsonObj);

      const typeIndex = entries.findIndex(entry => entry[0] === '@type');

      entries.splice(typeIndex + 1, 0, ...Object.entries(subClassOf));

      const newObj = {};
      for (const [key,value] of entries){
        newObj[key] = value;
      }
      return newObj;
    }
    return jsonObj;
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
