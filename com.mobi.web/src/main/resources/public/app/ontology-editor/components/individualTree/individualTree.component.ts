/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
// other Libs
import { Datasource, IDatasource } from 'ngx-ui-scroll';
import {every, filter, some, get, cloneDeep, findIndex} from 'lodash';
// Angular Imports
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
// Services
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
//constants
import { INDENT } from '../../../constants';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';

/**
 * @class ontology-editor.IndividualTreeComponent
 *
 * A component that creates a `div` containing a {@link shared.SearchBarComponent} and hierarchy of
 * {@link ontology-editor.TreeItemComponent}s of individuals. When search text is provided, the hierarchy filters what
 * is shown based on value matches with predicates in the {@link shared.OntologyManagerService entityNameProps}.
 *
 * @param {Object[]} hierarchy An array which represents a flattened individual hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
@Component({
    templateUrl: 'individualTree.component.html',
    selector: 'individual-tree'
})
export class IndividualTreeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() branchId;
    @Input() key;
    @Input() index: number;
    @Input() hierarchy: HierarchyNode[];
    @Output() updateSearch = new EventEmitter<string>();

    datasource: IDatasource = new Datasource({
        get: (index, count, success) => {
            const data = this.filteredHierarchy.slice(index, index + count);
            success(data);
        },
        settings: {
            bufferSize: 35,
            startIndex: 0,
            minIndex: 0
        }
    });

    indent = INDENT;
    searchText = '';
    filterText = '';
    filteredHierarchy = [];
    preFilteredHierarchy = [];
    midFilteredHierarchy = [];
    activeTab = '';
    dropdownFilterActive = false;
    dropdownFilters = [];
    activeEntityFilter;
    deprecatedEntityFilter;
    chunks = [];

    constructor(public om:OntologyStateService, public os: OntologyStateService, public util: UtilService) {}

    ngOnInit(): void {
        this.activeEntityFilter = {
            name: 'Hide unused imports',
            checked: false,
            flag: false,
            filter: node => {
                let match = true;
                if (this.os.isImported(node.entityIRI)) {
                    match = false;
                }
                return match;
            }
        };
        this.deprecatedEntityFilter = {
            name: 'Hide deprecated individuals',
            checked: false,
            flag: false,
            filter: node => {
                let match = true;
                if (this.os.isIriDeprecated(node.entityIRI)) {
                    match = false;
                }
                return match;
            }
        };

        this.dropdownFilters = [cloneDeep(this.activeEntityFilter), cloneDeep(this.deprecatedEntityFilter)];
        this.activeTab = this.os.getActiveKey();
        setTimeout( () => {
            this.update();
        }, 500);
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (!changesObj.hierarchy || !changesObj.hierarchy.isFirstChange()) {
            if (changesObj.branchId) {
                this.removeFilters();
            }
            setTimeout( () => {
                this.update();
            }, 500);
        }
    }
    ngOnDestroy(): void {
        if (this.os.listItem?.editorTabStates) {
            this.os.listItem.editorTabStates.individuals.index = 0;
        }
    }
    clickItem(entityIRI: string): void {
        this.os.selectItem(entityIRI).subscribe();
    }
    onKeyup(): void {
        this.filterText = this.searchText;
        this.dropdownFilterActive = some(this.dropdownFilters, 'flag');
        this.update();
    }
    matchesDropdownFilters(node: HierarchyNode): boolean {
        return every(this.dropdownFilters, filter => filter.flag ? filter.filter(node) : true);
    }
    shouldFilter(): string | boolean{
        return (this.filterText || this.dropdownFilterActive);
    }
    toggleOpen(node: HierarchyNode): void {
        node.isOpened = !node.isOpened;
        if (node.title) {
            node.set(this.os.listItem.versionedRdfRecord.recordId, node.isOpened);
        }
        node.isOpened ? this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath] = true : delete this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath];
        this.filteredHierarchy = filter(this.preFilteredHierarchy, node => this.isShown(node));
        this.datasource.adapter.reload(this.datasource.adapter.firstVisible.$index);
    }
    matchesSearchFilter(node: HierarchyNode): boolean {
        let searchMatch = false;
        // Check all possible name fields and entity fields to see if the value matches the search text
        some(node.entityInfo.names, name => {
            if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                searchMatch = true;
            }
        });

        if (searchMatch) {
            return true;
        }

        // Check if beautified entity id matches search text
        if (this.util.getBeautifulIRI(node.entityIRI).toLowerCase().includes(this.filterText.toLowerCase())) {
            searchMatch = true;
        }

        return searchMatch;
    }
    // Start at the current node and go up through the parents marking each path as an iriToOpen. If a path is already present in this.os.listItem.editorTabStates[this.activeTab].open, it means it was already marked as an iriToOpen by another one of it's children. In that scenario we know all of it's parents will also be open, and we can break out of the loop.
    openAllParents(node: HierarchyNode): void {
        for (let i = node.path.length - 1; i > 1; i--) {
            const fullPath = this.os.joinPath(node.path.slice(0, i));

            if (this.os.listItem.editorTabStates[this.activeTab].open[fullPath]) {
                break;
            }

            this.os.listItem.editorTabStates[this.activeTab].open[fullPath] = true;
        }
    }
    searchFilter(node: HierarchyNode): boolean{
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;
        if (node.isClass) {
            if (this.shouldFilter()) {
                delete node.isOpened;
                node.parentNoMatch = true;
            }
        } else {
            if (this.shouldFilter()) {
                delete node.isOpened;
                let match = false;

                if (this.matchesSearchFilter(node) && this.matchesDropdownFilters(node)) {
                    match = true;
                    this.openAllParents(node);
                    node.underline = true;
                }
                return match;
            }
        }
        return true;
    }
    openEntities(node: HierarchyNode): boolean {
        const toOpen = this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath];
        if (toOpen) {
            if (!node.isOpened) {
                node.isOpened = true;
            }
            node.displayNode = true;
        }
        return true;
    }
    isShown(node: HierarchyNode): boolean {
        const displayNode = (node.indent > 0 && this.os.areParentsOpen(node, this.activeTab)) || (node.indent === 0 && get(node, 'path', []).length === 2);
        if (this.shouldFilter() && node.parentNoMatch) {
            if (node.displayNode === undefined) {
                return false;
            } else {
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }
    updateDropdownFilters(value): void {
        this.dropdownFilters = value;
    }
    updateSearchText(value: string): void {
        this.searchText = value;
    }

    private removeFilters() {
        this.searchText = '';
        this.filterText = '';
        this.dropdownFilterActive = false;
        this.dropdownFilters = [cloneDeep(this.activeEntityFilter), cloneDeep(this.deprecatedEntityFilter)];
    }
    update(): void {
        if (this.filterText || this.dropdownFilterActive) {
            this.os.listItem.editorTabStates[this.activeTab].open = {};
        }
        this.updateSearch.emit(this.filterText);
        this.preFilteredHierarchy = this.hierarchy.filter(node => this.searchFilter(node));
        this.midFilteredHierarchy = this.preFilteredHierarchy.filter(node => this.openEntities(node));
        this.filteredHierarchy = this.midFilteredHierarchy.filter(node => this.isShown(node));
        let selectedIndex;
        if (this.os.listItem.selected) {
            selectedIndex = findIndex(this.filteredHierarchy, (entity) => {
                if (entity.entityIRI === this.os.listItem.selected['@id']) {
                    return true
                } else {
                    return false;
                }
            });
            selectedIndex < 0 ? this.datasource.adapter.reload(0) : this.datasource.adapter.reload(selectedIndex);
        } else {
            this.datasource.adapter.reload(this.index);
        }    }
}