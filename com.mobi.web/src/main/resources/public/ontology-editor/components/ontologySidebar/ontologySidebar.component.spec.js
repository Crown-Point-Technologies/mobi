/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import {
    mockComponent,
    mockOntologyManager,
    mockOntologyState,
    mockModal
} from '../../../../../../test/js/Shared';

describe('Ontology Sidebar component', function() {
    var $compile, scope, ontologyStateSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'openOntologySelect');
        mockOntologyManager();
        mockOntologyState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            modalSvc = _modalService_;
        });

        this.listItemA = { ontologyId: 'A', ontologyRecord: { recordId: 'A', recordTitle: 'A'}, active: false};
        this.listItemB = { ontologyId: 'B', ontologyRecord: { recordId: 'B', recordTitle: 'B'}, active: false };
        scope.list = [this.listItemA, this.listItemB];
        this.element = $compile(angular.element('<ontology-sidebar list="list"></ontology-sidebar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologySidebar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('list should be one way bound', function() {
            var copy = angular.copy(scope.list);
            this.controller.list = [{}];
            scope.$digest();
            expect(scope.list).toEqual(copy);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem = this.listItemA;
        });
        describe('should close a tab', function() {
            beforeEach(function() {
                ontologyStateSvc.recordIdToClose = '';
            });
            it('if it has changes', function() {
                this.controller.onClose({ ontologyRecord: { recordId: 'A' } });
                expect(ontologyStateSvc.recordIdToClose).toEqual('A');
                expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyCloseOverlay');
                expect(ontologyStateSvc.closeOntology).not.toHaveBeenCalled();
            });
            it('if it has no changes', function() {
                ontologyStateSvc.listItem = this.listItemB;
                ontologyStateSvc.hasChanges.and.returnValue(false);
                this.controller.onClose({ ontologyRecord: { recordId: 'B' } });
                expect(ontologyStateSvc.recordIdToClose).toEqual('');
                expect(modalSvc.openModal).not.toHaveBeenCalled();
                expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith('B');
            });
        });
        describe('onClick should set the listItem and active state correctly if listItem is', function() {
            beforeEach(function () {
                this.oldListItem = {id: 'id'};
                ontologyStateSvc.listItem = this.oldListItem;
            });
            describe('defined', function() {
                it('and does not have an entity snackbar open', function() {
                    ontologyStateSvc.listItem.goTo = null;
                    this.controller.onClick({ontologyRecord: {type: 'type'}});
                    expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {type: 'type'}, active: true});
                    expect(this.oldListItem.active).toEqual(false);
                });
                it('and does have an entity snackbar open', function() {
                    ontologyStateSvc.listItem.goTo = {};
                    this.controller.onClick({ontologyRecord: {type: 'type'}});
                    expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {type: 'type'}, active: true});
                    expect(this.oldListItem.active).toEqual(false);
                    expect(this.oldListItem.goTo.active).toEqual(false);
                    expect(this.oldListItem.goTo.entityIRI).toEqual('');
                });
            });
            it('undefined', function() {
                this.controller.onClick(undefined);
                expect(ontologyStateSvc.listItem).toEqual({});
                expect(this.oldListItem.active).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ONTOLOGY-SIDEBAR');
            expect(this.element.querySelectorAll('.ontology-sidebar').length).toEqual(1);
            expect(this.element.querySelectorAll('.button-container').length).toEqual(1);
        });
        it('with a .nav', function() {
            expect(this.element.querySelectorAll('ul.nav').length).toEqual(1);
        });
        it('depending on how many ontologies are open', function() {
            var tabs = this.element.querySelectorAll('li.nav-item');
            expect(tabs.length).toEqual(this.controller.list.length);
        });
        it('depending on whether an ontology is open', function() {
            this.listItemA.active = true;
            scope.$digest();
            var tab = angular.element(this.element.querySelectorAll('li.nav-item')[0]);
            expect(tab.hasClass('active')).toEqual(true);
            expect(tab.find('open-ontology-select').length).toEqual(1);
        });
    });
    it('should call onClick when the Ontologies button is clicked', function() {
        spyOn(this.controller, 'onClick');
        var button = angular.element(this.element.querySelectorAll('.button-container button')[0]);
        button.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalled();
    });
    it('should call onClick when an ontology nav item is clicked', function() {
        spyOn(this.controller, 'onClick');
        var link = angular.element(this.element.querySelectorAll('a.nav-link')[0]);
        link.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalledWith(this.listItemA);
    });
    it('should call onClose when a close icon on an ontology nav item is clicked', function() {
        spyOn(this.controller, 'onClose');
        var closeIcon = angular.element(this.element.querySelectorAll('.nav-item span.close-icon')[0]);
        closeIcon.triggerHandler('click');
        expect(this.controller.onClose).toHaveBeenCalledWith(this.listItemA);
    });
});
