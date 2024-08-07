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
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ManchesterConverterService} from '../../../shared/services/manchesterConverter.service';
import {forEach} from 'lodash';
import {RDFS} from '../../../prefixes';
import {splitIRI} from '../../../shared/pipes/splitIRI.pipe';
import { getSkolemizedIRI} from '../../../shared/utility';
import {JSONLDObject} from '../../../shared/models/JSONLDObject.interface';


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
               private mc: ManchesterConverterService,
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
      const deleteGCAsObj =
          this.findRelatedObjects(this.os.listItem.selectedBlankNodes, this.id);
      for ( const obj of deleteGCAsObj) {
        this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, obj);
      }
    }
    let values;
    this.gcaIRI = this.extractAfterSubClassOf();
    if(this.gcaIRI.split(' ').length > 3) {
      this.errorMessage = "General Class Axiom should have either one or two IRI."
      return;
    }
    const [firstEntity, operator, secondEntity] = this.gcaIRI.split(/(and | or |not |, )/).map(part => part.trim());
    const result = this.mc.manchesterToJsonld(this.expression, this.localNameMap, false);
    if (result.errorMessage) {
      this.errorMessage = result.errorMessage;
      return;
    } else if (result.jsonld.length === 0) {
      this.errorMessage = 'Expression resulted in no values. Please try again.';
      return;
    } else if(!this._getFullIRI(firstEntity) || (secondEntity && !this._getFullIRI(secondEntity))) {
        this.errorMessage = !this._getFullIRI(firstEntity) ?
            `"${firstEntity}" does not correspond to a known IRI`
            : `"${secondEntity}" does not correspond to a known IRI`;
        return;
    } else {
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

  _getFullIRI(ctx: string):boolean {
    const localName = ctx;
    const iri = this.localNameMap[localName];
    return iri;
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
    return `${this.os.listItem.ontologyId}${entity}`;
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
      this.errorMessage = 'Invalid subClass IRI. It does not correspond to a known IRI.';
    }

    entities = [this.getEntityName(firstEntity), this.getEntityName(secondEntity)];
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
      subClass = `${this.os.listItem.ontologyId}${this.gcaIRI}`;
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

  private createLocalNameMap() {
    const map = {};
    this.os.listItem.iriList.forEach(iri => {
      map[splitIRI(iri).end] = iri;
    });
    return map;
  }

}
