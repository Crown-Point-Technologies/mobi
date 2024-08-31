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
import {OntologyStateService} from "../../../shared/services/ontologyState.service";
import {ToastService} from "../../../shared/services/toast.service";
import {PropertyManagerService} from "../../../shared/services/propertyManager.service";
import {MatDialogRef} from "@angular/material/dialog";
import {debounceTime, map, startWith} from "rxjs/operators";
import {cloneDeep} from "lodash";
import {createJson} from "../../../shared/utility";
import {SameAsBlockComponent} from "../same-as-block/same-as-block.component";
import {OWL} from "../../../prefixes";

@Component({
  selector: 'app-same-as-overlay',
  templateUrl: './same-as-overlay.component.html',
  styleUrls: ['./same-as-overlay.component.scss']
})
export class SameAsOverlayComponent implements OnInit {
  individuals: {[key: string]: string} = {};
  propertyValue: string[] = []; // Array but only expect one value
  constructor(public os:OntologyStateService,
              private toast: ToastService,
              private pm: PropertyManagerService,
              private dialogRef: MatDialogRef<SameAsBlockComponent>) {}

  ngOnInit(): void {
    this.individuals = cloneDeep(this.os.listItem.individuals.iris);
    delete this.individuals[this.os.getActiveEntityIRI()];
  }

  addProperty(): void {
    const select = `${OWL}sameAs`;
    const value = this.propertyValue[0];
    const valueObj = {'@id': value};
    const added = this.pm.addId(this.os.listItem.selected, select, value);

    if (added) {
      this.os.addToAdditions(
          this.os.listItem.versionedRdfRecord.recordId,
          createJson(this.os.listItem.selected['@id'], select, valueObj)
      );
      this.os.saveCurrentChanges().subscribe();
    }
    this.dialogRef.close();
  }

}
