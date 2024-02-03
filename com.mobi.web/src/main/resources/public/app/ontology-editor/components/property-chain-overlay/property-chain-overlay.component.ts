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
import {UntypedFormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {XSD} from "../../../prefixes";

interface PropertyGroup {
  namespace: string,
  options: PropertyOption[]
}
interface PropertyOption {
  /*property: {
    iri: string,
    valuesKey: string
  }*/
  property: string,
  disabled: boolean,
  name: string
}
@Component({
  selector: 'app-property-chain-overlay',
  templateUrl: './property-chain-overlay.component.html',
  styleUrls: ['./property-chain-overlay.component.scss']
})
export class PropertyChainOverlayComponent implements OnInit {

  propertyChains: string[] = [];
  type = `${XSD}string`;
  filteredPropertyChains: Observable<PropertyGroup[]>;
  propertyChain = new UntypedFormControl('');
  additionalInputs: UntypedFormControl[] = [];

  constructor() { }

  ngOnInit(): void {

  }

  addPropertyInputField(){
    const newInput = new UntypedFormControl('');
    this.additionalInputs.push(newInput);
  }

  removePropertyInputField(index:number){
    this.additionalInputs.splice(index,1);
  }

  isPropertyFormValid():boolean {
    const allPropertyInputs = [this.propertyChain, ...this.additionalInputs];
    return allPropertyInputs.every(input=>input.valid);
  }

}
