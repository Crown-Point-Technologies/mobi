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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { range, map } from 'lodash';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { OWL } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { CommitCompiledResourceComponent } from '../../../shared/components/commitCompiledResource/commitCompiledResource.component';
import { Commit } from '../../../shared/models/commit.interface';
import { CommitChanges, ShapesGraphChangesPageComponent } from './shapesGraphChangesPage.component';

describe('Shapes Graph Changes Page component', function() {
    let component: ShapesGraphChangesPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphChangesPageComponent>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    const commitId = 'http://test.com#1234567890';
    const entityId = 'entityId';
    const commitChanges: CommitChanges = {
      id: entityId, 
      beautiful: '',
      difference: new Difference(),
      disableAll: false,
      showFull: false,
      resource: undefined,
      isBlankNode: false
    };
    const commit: Commit = {
        id: commitId,
        creator: undefined,
        date: '',
        auxiliary: '',
        base: '',
        message: ''
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatExpansionModule,
                MatTooltipModule,
                MatSlideToggleModule
            ],
            declarations: [
                MockComponent(InfoMessageComponent),
                MockComponent(CommitHistoryTableComponent),
                MockComponent(CommitCompiledResourceComponent),
                ShapesGraphChangesPageComponent
            ],
            providers: [
                MockProvider(ToastService),
                MockProvider(CatalogManagerService),
                MockProvider(ShapesGraphStateService)
            ]
        }).compileComponents();

        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
        fixture = TestBed.createComponent(ShapesGraphChangesPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'record';
        shapesGraphStateStub.listItem.inProgressCommit = new Difference();
        shapesGraphStateStub.updateShapesGraphMetadata.and.returnValue(of(null));
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
        toastStub = null;
        catalogManagerStub = null;
    });

    describe('should update the list of changes when additions/deletions change', function() {
        it('if there are less than 100 changes', function() {
            component.additions = [{'@id': 'http://test.com#1', 'value': ['stuff']}];
            component.deletions = [{'@id': 'http://test.com#1', 'value': ['otherstuff']}, {'@id': 'http://test.com#2'}];
            component.ngOnChanges();
            expect(component.showList).toEqual([
                {id: 'http://test.com#1', beautiful: '1', difference: new Difference([{'@id': 'http://test.com#1', 'value': ['stuff']}], [{'@id': 'http://test.com#1', 'value': ['otherstuff']}]), disableAll: false, showFull: false, resource: undefined, isBlankNode: false},
                {id: 'http://test.com#2', beautiful: '2', difference: new Difference([], [{'@id': 'http://test.com#2'}]), disableAll: false, showFull: false, resource: undefined, isBlankNode: false},
            ]);
        });
        it('if there are more than 100 changes', function() {
            const ids = range(102);
            component.additions = map(ids, id => ({'@id': '' + id}));
            component.deletions = [];
            component.ngOnChanges();
            expect(component.showList.length).toEqual(100);
        });
    });
    describe('controller methods', function() {
        describe('should remove in progress changes', function() {
            it('successfully', async function() {
                shapesGraphStateStub.listItem.inProgressCommit = new Difference();
                shapesGraphStateStub.listItem.inProgressCommit.additions = [{'@id': '12345', '@type': []}];
                component.index = 100;
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.index).toEqual(0);
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(''));
                const diff = new Difference();
                diff.additions = [{'@id': '12345', '@type': []}];
                shapesGraphStateStub.listItem.inProgressCommit = diff;
                component.index = 100;
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(diff);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(component.index).toEqual(100);
            });
        });
        it('should get more results', function() {
            component.chunks = [[commitChanges], [commitChanges]];
            expect(component.index).toEqual(0);
            expect(component.showList).toEqual([]);

            component.getMoreResults();
            expect(component.index).toEqual(1);
            expect(component.showList).toEqual([commitChanges]);
        });
        describe('should check if a specific type exists', function() {
            it('in additions', function() {
                const difference = new Difference([{'@id': entityId, '@type': [`${OWL}Class`]}]);
                expect(component.hasSpecificType(difference, entityId)).toBeTrue();
            });
            it('in deletions', function() {
                const difference = new Difference([], [{'@id': entityId, '@type': [`${OWL}Class`]}]);
                expect(component.hasSpecificType(difference, entityId)).toBeTrue();
            });
            it('when it exists with no types', function() {
                expect(component.hasSpecificType(new Difference([{'@id': entityId}]), entityId)).toBeFalse();
            });
            it('when it does not exist', function() {
                expect(component.hasSpecificType(new Difference(), entityId)).toBeFalse();
            });
        });
        it('should retrieve a list of commit changes', function() {
            component.list = [commitChanges];
            expect(component.chunks).toEqual([]);
            expect(component.getList()).toEqual([commitChanges]);
        });
        it('should return the commit id', function() {
            expect(component.getCommitId(commit)).toEqual(commitId);
        });
        describe('should open a selected commit', function() {
            it('successfully', fakeAsync(function() {
                shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(of(null));

                component.openCommit(commit);
                tick();
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record', null, commitId, null, '1234567890');
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(throwError('Error'));

                component.openCommit(commit);
                tick();
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record', null, commitId, null, '1234567890');
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
        describe('toggleFull sets the full resource on a changes item', function() {
            it('unless the full display should be removed', function() {
                const item = {id: entityId, beautiful: '', entityName: '', difference: new Difference(), disableAll: false, resource: {'@id': entityId}, showFull: false, isBlankNode: false};
                component.toggleFull(item);
                expect(catalogManagerStub.getCompiledResource).not.toHaveBeenCalled();
                expect(item.resource).toBeUndefined();
            });
            it('successfully', fakeAsync(function() {
                catalogManagerStub.getCompiledResource.and.returnValue(of([{'@id': 'id'}, {'@id': entityId}]));
                const item = {id: entityId, beautiful: '', entityName: '', difference: new Difference(), disableAll: false, resource: undefined, showFull: true, isBlankNode: false};
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.commitId, entityId);
                expect(item.resource).toEqual({'@id': entityId});
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getCompiledResource.and.returnValue(throwError('Error Message'));
                const item = {
                  id: entityId, 
                  beautiful: '',
                  entityName: '', 
                  difference: new Difference(), 
                  disableAll: false, 
                  resource: undefined, 
                  showFull: true, 
                  isBlankNode: false
                };
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.commitId, entityId);
                expect(item.resource).toBeUndefined();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('div.shapes-graph-changes-page')).length).toEqual(1);
        });
        it('when there are no changes', async function() {
            let infoMessage = element.queryAll(By.css('info-message'));
            expect(infoMessage.length).toEqual(0);

            shapesGraphStateStub.isCommittable.and.returnValue(false);
            fixture.detectChanges();
            await fixture.whenStable();
            infoMessage = element.queryAll(By.css('info-message'));

            expect(infoMessage.length).toBe(1);
            expect(infoMessage[0].nativeElement.innerText).toEqual('No Changes to Display');
            const buttons = element.queryAll(By.css('button'));
            expect(buttons.length).toEqual(0);

        });
        it('when there are changes', async function() {
            let infoMessage = element.queryAll(By.css('info-message'));
            expect(infoMessage.length).toEqual(0);

            shapesGraphStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            await fixture.whenStable();
            infoMessage = element.queryAll(By.css('info-message'));

            expect(infoMessage.length).toBe(0);
            const buttons = element.queryAll(By.css('button'));
            expect(buttons.length).toEqual(1);
            expect(['Remove All Changes']).toContain(buttons[0].nativeElement.textContent.trim());
        });
    });
    it('should call removeChanges when the button is clicked', async function() {
        shapesGraphStateStub.isCommittable.and.returnValue(true);
        fixture.detectChanges();
        await fixture.whenStable();

        spyOn(component, 'removeChanges');
        const setButton = element.queryAll(By.css('button'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.removeChanges).toHaveBeenCalledWith();
    });
});
