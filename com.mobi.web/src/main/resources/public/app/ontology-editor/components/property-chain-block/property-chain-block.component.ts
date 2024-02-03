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
import {MatDialog} from "@angular/material/dialog";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";
import {PropertyChainOverlayComponent} from "../property-chain-overlay/property-chain-overlay.component";

@Component({
  selector: 'app-property-chain-block',
  templateUrl: './property-chain-block.component.html',
  styleUrls: ['./property-chain-block.component.scss']
})
export class PropertyChainBlockComponent implements OnInit {

  constructor(private dialog: MatDialog, private pm: PropertyManagerService,public om: OntologyManagerService) { }

  ngOnInit(): void {
  }

  openAddOverlay(): void {
    this.dialog.open(PropertyChainOverlayComponent, {
      data: {
        axiomList: this.pm.datatypeAxiomList
      }
    }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
      if (result) {
        //this.updateDataPropHierarchy(result);
      }
    });
  }



}
