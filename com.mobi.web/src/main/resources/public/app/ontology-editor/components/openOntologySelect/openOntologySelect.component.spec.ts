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

import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS, ONTOLOGYSTATE } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyAction } from '../../../shared/models/ontologyAction';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { State } from '../../../shared/models/state.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EditBranchOverlayComponent } from '../editBranchOverlay/editBranchOverlay.component';
import { OpenOntologySelectComponent, OptionIcon } from './openOntologySelect.component';

describe('Open Ontology Select component', function() {
    let component: OpenOntologySelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OpenOntologySelectComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'http://test.com#1234567890';
    const tagId = 'tagId';
    const branch: JSONLDObject = {
        '@id': branchId,
        '@type': [`${CATALOG}Branch`],
        [`${DCTERMS}title`]: [{ '@value': 'title' }],
        [`${CATALOG}head`]: [{'@id': 'head'}]
    };
    const tag: JSONLDObject = {
        '@id': tagId,
        '@type': [`${CATALOG}Tag`, `${CATALOG}Version`],
        [`${DCTERMS}title`]: [{ '@value': 'title' }],
        [`${CATALOG}commit`]: [{'@id': commitId}]
    };
    const commit: JSONLDObject = {
        '@id': commitId,
        '@type': [`${CATALOG}Commit`]
    };
    const currentState: JSONLDObject = {
        '@id': 'currentState',
        [`${ONTOLOGYSTATE}branch`]: [{'@id': branchId}]
    };
    const recordState: JSONLDObject = {
        '@id': 'recordState',
        '@type': [`${ONTOLOGYSTATE}StateRecord`],
        [`${ONTOLOGYSTATE}currentState`]: [{'@id': currentState['@id']}]
    };
    const state: State = {
        id: 'state',
        model: [currentState, recordState]
    };

    let listItem: OntologyListItem;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatAutocompleteModule,
            ],
            declarations: [
                OpenOntologySelectComponent,
                MockComponent(ConfirmModalComponent),
                MockComponent(EditBranchOverlayComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                MockProvider(ToastService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OpenOntologySelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        listItem = new OntologyListItem();
        listItem.versionedRdfRecord.recordId = recordId;
        listItem.versionedRdfRecord.branchId = branchId;
        ontologyStateStub.ontologyRecordAction$ = of({recordId: '', action: undefined});
        ontologyStateStub.getStateByRecordId.and.returnValue(state);
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
    }); 

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub.deleteRecordBranch = null;
        ontologyStateStub = null;
        toastStub = null;
        matDialog = null;
        listItem = null;
    });

    describe('should initialize with the correct variables', function() {
        beforeEach(function() {
            spyOn(component, 'filter').and.returnValue([]);
            spyOn(component, 'updateState');
        });
        it('to handle search changes', function() {
            component.ngOnInit();
            fixture.detectChanges();
            expect(component.filter).toHaveBeenCalledWith('');
            component.ontologySearchControl.setValue('test');
            fixture.detectChanges();
            expect(component.filter).toHaveBeenCalledWith('test');
        });
        it('if there is a listItem', function() {
            component.listItem = listItem;
            component.ngOnInit();
            expect(component.catalogId).toEqual(catalogId);
            expect(component.updateState).toHaveBeenCalledWith();
        });
        it('to handle updates to the ontology state', fakeAsync(function() {
            component.listItem = listItem;
            ontologyStateStub.ontologyRecordAction$ = of({ recordId, action: OntologyAction.UPDATE_STATE });
            component.ngOnInit();
            tick();
            expect(component.updateState).toHaveBeenCalledWith();
        }));
    });
    describe('should correctly handle changes', function() {
        beforeEach(function() {
            spyOn(component, 'updateState');
        });
        describe('if the listItem has been changed', function() {
            beforeEach(function() {
                this.change = new SimpleChange(null, listItem, true);
            });
            it('and is committable', function() {
                ontologyStateStub.isCommittable.and.returnValue(true);
                component.ngOnChanges({listItem: this.change});
                expect(ontologyStateStub.hasChanges).toHaveBeenCalledWith(listItem);
                expect(ontologyStateStub.isCommittable).toHaveBeenCalledWith(listItem);
                expect(component.updateState).toHaveBeenCalledWith();
                expect(component.ontologySearchControl.disabled).toBeTruthy();
            });
            it('and is not committable', function() {
                ontologyStateStub.isCommittable.and.returnValue(false);
                component.ngOnChanges({listItem: this.change});
                expect(ontologyStateStub.hasChanges).toHaveBeenCalledWith(listItem);
                expect(ontologyStateStub.isCommittable).toHaveBeenCalledWith(listItem);
                expect(component.updateState).toHaveBeenCalledWith();
                expect(component.ontologySearchControl.enabled).toBeTruthy();
            });
        });
        it('if the listItem has not been changed', function() {
            component.ngOnChanges({});
            expect(ontologyStateStub.hasChanges).not.toHaveBeenCalled();
            expect(ontologyStateStub.isCommittable).not.toHaveBeenCalled();
            expect(component.updateState).not.toHaveBeenCalled();
        });
        it('if the listItem is undefined', function() {
            const change = new SimpleChange(null, undefined, true);
            component.ngOnChanges({listItem: change});
            expect(ontologyStateStub.hasChanges).not.toHaveBeenCalled();
            expect(ontologyStateStub.isCommittable).not.toHaveBeenCalled();
            expect(component.updateState).not.toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should handle an update to the state', function() {
            beforeEach(function() {
                component.listItem = listItem;
                spyOn(component, 'canDelete').and.returnValue(true);
            });
            it('if it is a branch', function() {
                listItem.branches = [branch];
                catalogManagerStub.isUserBranch.and.returnValue(false);
                ontologyStateStub.isStateBranch.and.returnValue(true);
                component.updateState();
                expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                expect(component.state).toEqual(state);
                expect(component.currentState).toEqual(currentState);
                expect(catalogManagerStub.isUserBranch).toHaveBeenCalledWith(branch);
                expect(component.selected).toEqual({
                    title: 'title',
                    type: 'Branch',
                    canDelete: true,
                    isUserBranch: false,
                    jsonld: branch,
                    icon: OptionIcon.BRANCH
                });
                expect(component.ontologySearchControl.value).toEqual('title');
            });
            it('if it is a tag', function() {
                listItem.tags = [tag];
                const currentStateClone = cloneDeep(currentState);
                delete currentStateClone[`${ONTOLOGYSTATE}branch`];
                currentStateClone[`${ONTOLOGYSTATE}tag`] = [{ '@id': tagId }];
                const stateClone = cloneDeep(state);
                stateClone.model = [currentStateClone, recordState];
                ontologyStateStub.getStateByRecordId.and.returnValue(stateClone);
                ontologyStateStub.isStateTag.and.returnValue(true);
                component.updateState();
                expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                expect(component.state).toEqual(stateClone);
                expect(component.currentState).toEqual(currentStateClone);
                expect(catalogManagerStub.isUserBranch).not.toHaveBeenCalled();
                expect(component.selected).toEqual({
                    title: 'title',
                    type: 'Tag',
                    canDelete: true,
                    isUserBranch: false,
                    jsonld: tag,
                    icon: OptionIcon.TAG
                });
                expect(component.ontologySearchControl.value).toEqual('title');
            });
            it('if it is a commit', function() {
                const currentStateClone = cloneDeep(currentState);
                delete currentStateClone[`${ONTOLOGYSTATE}branch`];
                currentStateClone[`${ONTOLOGYSTATE}commit`] = [{ '@id': commitId }];
                const stateClone = cloneDeep(state);
                stateClone.model = [currentStateClone, recordState];
                ontologyStateStub.getStateByRecordId.and.returnValue(stateClone);
                component.updateState();
                expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                expect(component.state).toEqual(stateClone);
                expect(component.currentState).toEqual(currentStateClone);
                expect(catalogManagerStub.isUserBranch).not.toHaveBeenCalled();
                expect(component.selected).toEqual({
                    title: '1234567890',
                    type: 'Commit',
                    canDelete: false,
                    isUserBranch: false,
                    jsonld: {
                        '@id': commitId,
                        '@type': [`${CATALOG}Commit`],
                        [`${DCTERMS}title`]: [{'@value': '1234567890'}]
                    },
                    icon: OptionIcon.COMMIT
                });
                expect(component.ontologySearchControl.value).toEqual('1234567890');
            });
        });
        describe('determines whether an entity can be deleted', function() {
            it('if it is a branch', function() {
                catalogManagerStub.isBranch.and.returnValue(true);
                component.listItem = listItem;
                
                const branchClone = cloneDeep(branch);
                branchClone[`${DCTERMS}title`] = [{ '@value': 'MASTER' }];
                expect(component.canDelete(branchClone)).toBeFalse();

                expect(component.canDelete(branch)).toBeFalse();

                listItem.userCanModify = true;
                expect(component.canDelete(branch)).toBeFalse();
            
                expect(component.canDelete({'@id': 'otherBranch'})).toBeTrue();
            });
            it('if it is a tag', function() {
                catalogManagerStub.isTag.and.returnValue(true);
                component.listItem = listItem;
                const currentStateClone = cloneDeep(currentState);
                currentStateClone[`${ONTOLOGYSTATE}tag`] = [{ '@id': tagId}];
                component.currentState = currentStateClone;
            
                expect(component.canDelete(tag)).toBeFalse();
            
                listItem.userCanModify = true;
                expect(component.canDelete(tag)).toBeFalse();

                expect(component.canDelete({'@id': 'otherTag'})).toBeTrue();
            });
            it('if it\'s anything else', function() {
                expect(component.canDelete({'@id': ''})).toBeFalse();
            });
        });
        describe('changeEntity calls the correct methods', function() {
            beforeEach(function() {
                spyOn(component, 'updateSelected');
                spyOn(component.ontologySearch.nativeElement, 'blur');
            });
            it('if an option is selected', function() {
                const option = {
                    title: '',
                    type: '',
                    canDelete: false,
                    isUserBranch: false,
                    jsonld: undefined,
                    icon: undefined
                };
                const event = {
                    option: {
                        value: option
                    }
                } as MatAutocompleteSelectedEvent;
                component.changeEntity(event);
                expect(component.updateSelected).toHaveBeenCalledWith(option);
                expect(component.ontologySearch.nativeElement.blur).toHaveBeenCalledWith();
            });
            it('if no option was selected', function() {
                const event = {
                    option: {
                        value: undefined
                    }
                } as MatAutocompleteSelectedEvent;
                component.changeEntity(event);
                expect(component.updateSelected).not.toHaveBeenCalled();
                expect(component.ontologySearch.nativeElement.blur).not.toHaveBeenCalled();
            });
        });
        describe('updateSelected calls the correct methods', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
                component.state = state;
                component.listItem = listItem;
            });
            describe('if the entity is a branch', function() {
                beforeEach(function() {
                    this.option = {
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        canDelete: true,
                        isUserBranch: false,
                        icon: undefined
                    };
                });
                describe('when getRecordBranch resolves', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
                    });
                    it('when updateOntology resolves and the branch state has no commit id', fakeAsync(function() {
                        ontologyStateStub.updateOntology.and.returnValue(of(null));
                        component.updateSelected(this.option);
                        tick();
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(recordId, branchId, 'head', true);
                        expect(component.ontologySearchControl.value).toEqual(this.option.title);
                        expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith(listItem);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('when updateOntology rejects and the branch state has a commit id', fakeAsync(function() {
                        const currentStateClone = cloneDeep(currentState);
                        currentStateClone[`${ONTOLOGYSTATE}commit`] = [{ '@id': commitId }];
                        const stateClone = cloneDeep(state);
                        stateClone.model = [currentStateClone, recordState];
                        component.state = stateClone;
                        ontologyStateStub.updateOntology.and.returnValue(throwError(error));
                        component.updateSelected(this.option);
                        tick();
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(recordId, branchId, commitId, false);
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                    }));
                });
                it('when getRecordBranch rejects', fakeAsync(function() {
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                    component.updateSelected(this.option);
                    tick();
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                    expect(component.ontologySearchControl.value).toBeNull();
                    expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                }));
            });
            describe('if the entity is a tag', function() {
                beforeEach(function() {
                    this.option = {
                        title: 'title',
                        type: 'Tag',
                        jsonld: tag,
                        canDelete: true,
                        isUserBranch: false,
                        icon: undefined
                    };
                });
                describe('when getCommit resolves', function() {
                    beforeEach(function() {
                        catalogManagerStub.getCommit.and.returnValue(of(commit));
                    });
                    it('when updateOntologyWithCommit resolves', fakeAsync(function() {
                        ontologyStateStub.updateOntologyWithCommit.and.returnValue(of(null));
                        component.updateSelected(this.option);
                        tick();
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(ontologyStateStub.updateOntologyWithCommit).toHaveBeenCalledWith(recordId, commitId, tagId);
                        expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith(listItem);
                        expect(component.ontologySearchControl.value).toEqual(this.option.title);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('when updateOntologyWithCommit rejects', fakeAsync(function() {
                        ontologyStateStub.updateOntologyWithCommit.and.returnValue(throwError(error));
                        component.updateSelected(this.option);
                        tick();
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(ontologyStateStub.updateOntologyWithCommit).toHaveBeenCalledWith(recordId, commitId, tagId);
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                    }));
                });
                it('when getCommit rejects', fakeAsync(function() {
                    catalogManagerStub.getCommit.and.returnValue(throwError(error));
                    component.updateSelected(this.option);
                    tick();
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                    expect(ontologyStateStub.updateOntologyWithCommit).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                    expect(component.ontologySearchControl.value).toBeNull();
                    expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                }));
            });
            it('if the entity is a commit', function() {
                component.updateSelected({
                    title: 'title',
                    type: 'Commit',
                    jsonld: commit,
                    canDelete: false,
                    isUserBranch: false,
                    icon: undefined
                });
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
            });
        });
        it('should handle opening the autocomplete panel', function() {
            component.ontologySearchControl.setValue('test');
            component.openPanel();
            expect(component.ontologySearchControl.value).toEqual('');
        });
        it('should handle closing the autocomplete panel', function() {
            component.selected = {
                title: 'title',
                type: 'Branch',
                jsonld: undefined,
                canDelete: false,
                isUserBranch: false,
                icon: undefined
            };
            component.closePanel();
            expect(component.ontologySearchControl.value).toEqual('title');
        });
        describe('openDeleteConfirmation calls the correct methods if the entity is', function() {
            beforeEach(function() {
                this.event = new MouseEvent('click');
                spyOn(this.event, 'stopPropagation');
                spyOn(component, 'deleteBranch');
                spyOn(component, 'deleteTag');
                spyOn(component.autocompleteTrigger, 'closePanel');
            });
            describe('a branch and', function() {
                it('a user branch', fakeAsync(function() {
                    component.openDeleteConfirmation({
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        canDelete: false,
                        isUserBranch: true,
                        icon: undefined
                    }, this.event);
                    tick();
                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                    expect(this.event.stopPropagation).toHaveBeenCalledWith();
                    expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringContaining('diverging changes')}});
                    expect(component.deleteBranch).toHaveBeenCalledWith(branch);
                    expect(component.deleteTag).not.toHaveBeenCalled();
                }));
                it('not a user branch', fakeAsync(function() {
                    component.openDeleteConfirmation({
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        canDelete: false,
                        isUserBranch: false,
                        icon: undefined
                    }, this.event);
                    tick();
                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                    expect(this.event.stopPropagation).toHaveBeenCalledWith();
                    expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching(/^((?!diverging changes).)*$/)}});
                    expect(component.deleteBranch).toHaveBeenCalledWith(branch);
                    expect(component.deleteTag).not.toHaveBeenCalled();
                }));
            });
            it('a tag', fakeAsync(function() {
                component.openDeleteConfirmation({
                    title: 'title',
                    type: 'Tag',
                    jsonld: tag,
                    canDelete: false,
                    isUserBranch: true,
                    icon: undefined
                }, this.event);
                tick();
                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                expect(this.event.stopPropagation).toHaveBeenCalledWith();
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringContaining('delete Tag')}});
                expect(component.deleteBranch).not.toHaveBeenCalled();
                expect(component.deleteTag).toHaveBeenCalledWith(tag);
            }));
        });
        it('openEditOverlay calls the correct methods', fakeAsync(function() {
            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');
            spyOn(component, 'handleBranchEdit');
            component.openEditOverlay(branch, event);
            tick();
            expect(event.stopPropagation).toHaveBeenCalledWith();
            expect(matDialog.open).toHaveBeenCalledWith(EditBranchOverlayComponent, {data: { branch }});
            expect(component.handleBranchEdit).toHaveBeenCalledWith(branch);
        }));
        describe('deleteBranch calls the correct methods', function() {
            const currentStateClone = cloneDeep(currentState);
            currentStateClone[`${ONTOLOGYSTATE}commit`] = [{ '@id': commitId }];
            beforeEach(function() {
                component.catalogId = catalogId;
                component.listItem = listItem;
                component.currentState = currentStateClone;
                spyOn(component, 'changeToMaster');
            });
            describe('when deleteRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
                });
                describe('and the current state is not a branch', function() {
                    beforeEach(function() {
                        ontologyStateStub.isStateBranch.and.returnValue(false);
                    });
                    it('and getCommit is resolved', fakeAsync(function() {
                        catalogManagerStub.getCommit.and.returnValue(of(null));
                        component.deleteBranch(branch);
                        tick();
                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                        expect(ontologyStateStub.isStateBranch).toHaveBeenCalledWith(currentStateClone);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(component.changeToMaster).not.toHaveBeenCalled();
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('and getCommit is rejected', fakeAsync(function() {
                        catalogManagerStub.getCommit.and.returnValue(throwError('Error message'));
                        component.deleteBranch(branch);
                        tick();
                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                        expect(ontologyStateStub.isStateBranch).toHaveBeenCalledWith(currentStateClone);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(component.changeToMaster).toHaveBeenCalledWith();
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                });
                it('and the current state is a branch', fakeAsync(function() {
                    component.selected = {
                        title: 'title',
                        type: 'Branch',
                        isUserBranch: false,
                        canDelete: true,
                        jsonld: undefined,
                        icon: undefined
                    };
                    ontologyStateStub.isStateBranch.and.returnValue(true);
                    component.deleteBranch(branch);
                    tick();
                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                    expect(ontologyStateStub.isStateBranch).toHaveBeenCalledWith(currentStateClone);
                    expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
                    expect(component.changeToMaster).not.toHaveBeenCalled();
                    expect(component.ontologySearchControl.value).toEqual('title');
                    expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith(listItem);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
            });
            it('when deleteRecordBranch is rejected', fakeAsync(function() {
                catalogManagerStub.deleteRecordBranch.and.returnValue(throwError(error));
                component.deleteBranch(branch);
                tick();
                expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                expect(ontologyStateStub.isStateBranch).not.toHaveBeenCalled();
                expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
                expect(component.changeToMaster).not.toHaveBeenCalled();
                expect(component.ontologySearchControl.value).toBeNull();
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        describe('deleteTag calls the correct methods', function() {
            const currentStateClone = cloneDeep(currentState);
            currentStateClone[`${ONTOLOGYSTATE}commit`] = [{ '@id': commitId }];
            beforeEach(function() {
                component.catalogId = catalogId;
                component.listItem = listItem;
                listItem.tags = [tag];
                component.currentState = currentStateClone;
                spyOn(component, 'changeToMaster');
            });
            describe('when deleteRecordVersion is resolved', function() {
                beforeEach(function() {
                    catalogManagerStub.deleteRecordVersion.and.returnValue(of(null));
                });
                describe('and the current state is not a tag', function() {
                    beforeEach(function() {
                        ontologyStateStub.isStateTag.and.returnValue(false);
                    });
                    it('and the commit referenced no longer exists', fakeAsync(function() {
                        catalogManagerStub.getCommit.and.returnValue(throwError(error));
                        component.deleteTag(tag);
                        tick();
                        expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                        expect(component.listItem.tags).not.toContain(tag);
                        expect(ontologyStateStub.isStateTag).toHaveBeenCalledWith(currentStateClone);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(component.changeToMaster).toHaveBeenCalledWith();
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('and the commit referenced still exists', fakeAsync(function() {
                        catalogManagerStub.getCommit.and.returnValue(of(commit));
                        component.deleteTag(tag);
                        tick();
                        expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                        expect(component.listItem.tags).not.toContain(tag);
                        expect(ontologyStateStub.isStateTag).toHaveBeenCalledWith(currentStateClone);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(commitId);
                        expect(component.changeToMaster).not.toHaveBeenCalled();
                        expect(component.ontologySearchControl.value).toBeNull();
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                });
                it('and the current state is a tag', fakeAsync(function() {
                    component.selected = {
                        title: 'title',
                        type: 'Tag',
                        isUserBranch: false,
                        canDelete: true,
                        jsonld: undefined,
                        icon: undefined
                    };
                    ontologyStateStub.isStateTag.and.returnValue(true);
                    component.deleteTag(tag);
                    tick();
                    expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                    expect(component.listItem.tags).not.toContain(tag);
                    expect(ontologyStateStub.isStateTag).toHaveBeenCalledWith(currentStateClone);
                    expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
                    expect(component.changeToMaster).not.toHaveBeenCalled();
                    expect(component.ontologySearchControl.value).toEqual('title');
                    expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith(listItem);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
            });
            it('when deleteRecordVersion is rejected', fakeAsync(function() {
                catalogManagerStub.deleteRecordVersion.and.returnValue(throwError(error));
                component.deleteTag(tag);
                tick();
                expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tagId, recordId, catalogId);
                expect(component.listItem.tags).toContain(tag);
                expect(ontologyStateStub.isStateTag).not.toHaveBeenCalled();
                expect(catalogManagerStub.getCommit).not.toHaveBeenCalled();
                expect(component.changeToMaster).not.toHaveBeenCalled();
                expect(component.ontologySearchControl.value).toBeNull();
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        it('should handle an edit to a branch', function() {
            component.currentState = currentState;
            component.listItem = listItem;
            listItem.branches = [branch];
            spyOn(component, 'canDelete').and.returnValue(true);
            catalogManagerStub.isUserBranch.and.returnValue(false);
            ontologyStateStub.isStateBranch.and.returnValue(true);
            component.handleBranchEdit({'@id': 'other'});
            expect(component.selected).toBeUndefined();
            expect(component.ontologySearchControl.value).toBeNull();

            component.handleBranchEdit(branch);
            expect(component.selected).toEqual({
                title: 'title',
                type: 'Branch',
                canDelete: true,
                isUserBranch: false,
                jsonld: branch,
                icon: OptionIcon.BRANCH
            });
            expect(component.ontologySearchControl.value).toEqual('title');
        });
        it('should change to the master branch', function() {
            component.currentState = {'@id': 'id'};
            component.listItem = listItem;
            listItem.masterBranchIri = 'master';
            spyOn(component, 'updateSelected');
            component.changeToMaster();
            expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.stringContaining('no longer exists'));
            expect(component.updateSelected).toHaveBeenCalledWith({
                title: 'MASTER',
                type: 'Branch',
                isUserBranch: false,
                canDelete: false,
                jsonld: {
                    '@id': 'master',
                    '@type': [`${CATALOG}Branch`]
                },
                icon: OptionIcon.BRANCH
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.open-ontology-select')).length).toEqual(1);
        });
        ['input[placeholder="Open at..."]', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether something is selected', function() {
            expect(element.queryAll(By.css('mat-icon')).length).toEqual(0);
            
            component.selected = {
                title: 'title',
                type: 'Commit',
                jsonld: {'@id': commitId},
                isUserBranch: false,
                canDelete: false,
                icon: OptionIcon.COMMIT
            };
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-icon')).length).toEqual(1);
        });
        it('depending on whether an entity is a branch and the user can modify', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();

            spyOn(component, 'openPanel');
            spyOn(component, 'closePanel');
            component.listItem = listItem;
            listItem.userCanModify = true;
            component.filteredOptions = of([
                {
                    title: 'Branches',
                    options: [{
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        isUserBranch: false,
                        canDelete: true,
                        icon: OptionIcon.BRANCH
                    }]
                }
            ]);
            component.autocompleteTrigger.openPanel();
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('.entity-display a')).length).toEqual(2);
        });
        it('depending on whether an entity is a branch and the user cannot modify', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();

            spyOn(component, 'openPanel');
            spyOn(component, 'closePanel');
            component.listItem = listItem;
            component.filteredOptions = of([
                {
                    title: 'Branches',
                    options: [{
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        isUserBranch: false,
                        canDelete: false,
                        icon: OptionIcon.BRANCH
                    }]
                }
            ]);
            component.autocompleteTrigger.openPanel();
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('.entity-display a')).length).toEqual(0);
        });
        it('depending on whether an entity is the master branch', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();

            spyOn(component, 'openPanel');
            spyOn(component, 'closePanel');
            component.listItem = listItem;
            listItem.userCanModify = true;
            component.filteredOptions = of([
                {
                    title: 'Branches',
                    options: [{
                        title: 'MASTER',
                        type: 'Branch',
                        jsonld: branch,
                        isUserBranch: false,
                        canDelete: false,
                        icon: OptionIcon.BRANCH
                    }]
                }
            ]);
            component.autocompleteTrigger.openPanel();
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('.entity-display a')).length).toEqual(0);
        });
        it('depending on whether a branch is a user branch', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();

            spyOn(component, 'openPanel');
            spyOn(component, 'closePanel');
            component.listItem = listItem;
            component.filteredOptions = of([
                {
                    title: 'Branches',
                    options: [{
                        title: 'title',
                        type: 'Branch',
                        jsonld: branch,
                        isUserBranch: true,
                        canDelete: true,
                        icon: OptionIcon.BRANCH
                    }]
                }
            ]);
            component.autocompleteTrigger.openPanel();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('.fa.fa-exclamation-triangle.fa-fw-red')).length).toEqual(1);
        });
    });
});
