/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ShapesGraphDetailsComponent } from './shapesGraphDetails.component';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { StaticIriLimitedComponent } from '../staticIriLimited/staticIriLimited.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { cleanStylesFromDOM, mockOntologyManager, mockPrefixes } from '../../../../../../test/ts/Shared';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { DebugElement } from '@angular/core';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { By } from '@angular/platform-browser';

describe('Shapes Graph Details component', function() {
    let component: ShapesGraphDetailsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphDetailsComponent>;
    let shapesGraphStateStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ShapesGraphDetailsComponent,
                MockComponent(StaticIriLimitedComponent),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                PrefixationPipe,
                MockProvider(ShapesGraphStateService),
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'ontologyManagerService', useClass: mockOntologyManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphDetailsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new VersionedRdfListItem();
        shapesGraphStateStub.listItem.metadata = {};
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-details')).length).toEqual(1);
        });
        it('depending on whether the selected entity has types', function() {
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(0);
            shapesGraphStateStub.listItem.metadata['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                shapesGraphStateStub.listItem.metadata = {};
                expect(component.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                let expected = 'test, test2';
                shapesGraphStateStub.listItem.metadata = {'@type': ['test', 'test2']};
                expect(component.getTypes()).toEqual(expected);
            });
        });
    });
});