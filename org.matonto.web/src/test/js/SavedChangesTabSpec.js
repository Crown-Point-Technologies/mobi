/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Saved Changes Tab directive', function() {
    var $compile, scope, $q, element, controller, ontologyStateSvc, ontologyManagerSvc, utilSvc, catalogManagerSvc, prefixes, catalogId;

    beforeEach(function() {
        module('templates');
        module('savedChangesTab');
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockCatalogManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _catalogManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
        });

        catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        ontologyStateSvc.listItem.inProgressCommit = {additions: [], deletions: []};
        element = $compile(angular.element('<saved-changes-tab></saved-changes-tab>'))(scope);
        scope.$digest();
        controller = element.controller('savedChangesTab');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('saved-changes-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with .btn', function() {
            expect(element.querySelectorAll('.btn-container .btn').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.btn-container .btn').length).toBe(1);
        });
        it('with .property-values', function() {
            expect(element.querySelectorAll('.property-values').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
            scope.$apply();
            expect(element.querySelectorAll('.property-values').length).toBe(1);
        });
        it('with statement-display dependent on how many additions/deletions there are', function() {
            expect(element.find('statement-display').length).toBe(0);
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id', 'value': ['stuff']}];
            utilSvc.getChangesById.and.returnValue([{}]);
            scope.$apply();
            expect(element.find('statement-display').length).toBe(2);
        });
        it('depending on whether the list item is up to date', function() {
            expect(element.querySelectorAll('block-content .text-center info-message').length).toBe(1);
            expect(element.querySelectorAll('block-content .text-center error-display').length).toBe(0);

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(element.querySelectorAll('block-content .text-center info-message').length).toBe(0);
            expect(element.querySelectorAll('block-content .text-center error-display').length).toBe(1);

            ontologyStateSvc.listItem.inProgressCommit.additions = [{}];
            scope.$digest();
            expect(element.querySelectorAll('block-header error-display').length).toBe(1);

            ontologyStateSvc.listItem.upToDate = true;
            scope.$digest();
            expect(element.querySelectorAll('block-header error-display').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('should go to a specific entity', function() {
            var event = {
                stopPropagation: jasmine.createSpy('stopPropagation')
            };
            controller.go(event, 'A');
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('A');
        });
        describe('should update the selected ontology', function() {
            beforeEach(function() {
                this.commitId = 'commit';
                catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': this.commitId}}));
            });
            it('unless an error occurs', function() {
                ontologyManagerSvc.updateOntology.and.returnValue($q.reject('Error message'));
                controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, jasmine.any(String));
                expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, this.commitId, ontologyStateSvc.listItem.type);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                ontologyManagerSvc.updateOntology.and.returnValue($q.when());
                controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, jasmine.any(String));
                expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, this.commitId, ontologyStateSvc.listItem.type);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('removeChanges calls the correct manager methods and sets the correct variables', function() {
            var deleteDeferred;
            beforeEach(function() {
                deleteDeferred = $q.defer();
                catalogManagerSvc.deleteInProgressCommit.and.returnValue(deleteDeferred.promise);
                ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'id'}];
                ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': 'id'}];
            });
            describe('when deleteInProgressCommit resolves', function() {
                var updateDeferred;
                beforeEach(function() {
                    updateDeferred = $q.defer();
                    ontologyManagerSvc.updateOntology.and.returnValue(updateDeferred.promise);
                    deleteDeferred.resolve();
                    controller.removeChanges();
                });
                it('and updateOntology resolves', function() {
                    updateDeferred.resolve();
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                    expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.state.type, ontologyStateSvc.listItem.upToDate);
                    expect(ontologyStateSvc.clearInProgressCommit).toHaveBeenCalled();
                });
                it('and updateOntology rejects', function() {
                    updateDeferred.reject('error');
                    scope.$digest();
                    expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                    expect(controller.error).toEqual('error');
                });
            });
            it('when deleteInProgressCommit rejects', function() {
                deleteDeferred.reject('error');
                controller.removeChanges();
                scope.$digest();
                expect(catalogManagerSvc.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, catalogId);
                expect(controller.error).toBe('error');
            });
        });
        /*describe('setChecked should set the checked variable to the provided value for all items in the list', function() {
            beforeEach(function() {
                controller.list = [{
                    id: 'id',
                    additions: [{
                        p: prefixes.rdf + 'type',
                        o: prefixes.owl + 'Class'
                    }, {
                        p: 'predicate',
                        o: 'object'
                    }],
                    deletions: [{
                        p: 'predicate',
                        o: 'object'
                    }]
                }];
            });
            it('and not set disabled if not on the list item', function() {
                controller.setChecked(true);
                expect(controller.list[0].additions[0].checked).toBe(true);
                expect(controller.list[0].additions[0].disabled).toBeUndefined();
                expect(controller.list[0].additions[1].checked).toBe(true);
                expect(controller.list[0].additions[1].disabled).toBeUndefined();
                expect(controller.list[0].deletions[0].checked).toBe(true);
                expect(controller.list[0].deletions[0].disabled).toBeUndefined();
            });
            it('and set disabled if on the list item', function() {
                controller.list[0].disableAll = true;
                controller.setChecked(true);
                expect(controller.list[0].additions[0].checked).toBe(true);
                expect(controller.list[0].additions[0].disabled).toBeUndefined();
                expect(controller.list[0].additions[1].checked).toBe(true);
                expect(controller.list[0].additions[1].disabled).toBe(true);
                expect(controller.list[0].deletions[0].checked).toBe(true);
                expect(controller.list[0].deletions[0].disabled).toBe(true);
            });
        });
        describe('onAdditionCheck', function() {
            beforeEach(function() {
                controller.list = [{
                    id: 'id',
                    additions: [{
                        p: prefixes.rdf + 'type',
                        o: prefixes.owl + 'Class'
                    }, {
                        p: 'predicate',
                        o: 'object'
                    }]
                }];
            });
            it('checks nothing if predicate is not the typeIRI', function() {
                controller.onAdditionCheck('id', 'not-typeIRI', 'object', true);
                expect(controller.list[0].additions[1].checked).toBeUndefined();
                expect(controller.list[0].additions[1].disabled).toBeUndefined();
            });
            it('checks nothing if object is not in the types array', function() {
                controller.onAdditionCheck('id', prefixes.rdf + 'type', 'object', true);
                expect(controller.list[0].additions[1].checked).toBeUndefined();
                expect(controller.list[0].additions[1].disabled).toBeUndefined();
            });
            it('checks all others if object is in the types array and predicate is the typeIRI', function() {
                controller.onAdditionCheck('id', prefixes.rdf + 'type', prefixes.owl + 'Class', true);
                expect(controller.list[0].additions[1].checked).toBe(true);
                expect(controller.list[0].additions[1].disabled).toBe(true);
            });
        });
        describe('onDeletionCheck', function() {
            beforeEach(function() {
                controller.list = [{
                    id: 'id',
                    deletions: [{
                        p: prefixes.rdf + 'type',
                        o: prefixes.owl + 'Class'
                    }, {
                        p: 'predicate',
                        o: 'object'
                    }]
                }];
            });
            it('checks and disables the typeIRI statement if the statement is checked and is not a typeIRI', function() {
                controller.onDeletionCheck('id', 'predicate', prefixes.owl + 'Class', true);
                expect(controller.list[0].deletions[0].checked).toBe(true);
                expect(controller.list[0].deletions[0].disabled).toBe(true);
            });
            it('checks and disables the typeIRI statement if the statement is checked and is a typeIRI not in the types array', function() {
                controller.onDeletionCheck('id', prefixes.rdf + 'type', prefixes.owl + 'FunctionalProperty', true);
                expect(controller.list[0].deletions[0].checked).toBe(true);
                expect(controller.list[0].deletions[0].disabled).toBe(true);
            });
            it('enables the typeIRI statement if the statement is not checked and is not a typeIRI', function() {
                controller.onDeletionCheck('id', 'predicate', prefixes.owl + 'Class', false);
                expect(controller.list[0].deletions[0].checked).toBeUndefined();
                expect(controller.list[0].deletions[0].disabled).toBe(false);
            });
            it('enables the typeIRI statement if the statement is not checked and is not a typeIRI', function() {
                controller.onDeletionCheck('id', prefixes.rdf + 'type', prefixes.owl + 'FunctionalProperty', false);
                expect(controller.list[0].deletions[0].checked).toBeUndefined();
                expect(controller.list[0].deletions[0].disabled).toBe(false);
            });
            it('does nothing if the statement is a typeIRI in the types array', function() {
                controller.onDeletionCheck('id', prefixes.rdf + 'type', prefixes.owl + 'Class', false);
                expect(controller.list[0].deletions[0].checked).toBeUndefined();
                expect(controller.list[0].deletions[0].disabled).toBeUndefined();
            });
        });
        describe('removeChecked should delete all of the checked statements', function() {
            var saveDeferred;
            beforeEach(function() {
                saveDeferred = $q.defer();
                ontologyManagerSvc.saveChanges.and.returnValue(saveDeferred.promise);
            });
            describe('when saveChanges resolves', function() {
                var afterDeferred;
                beforeEach(function() {
                    saveDeferred.resolve();
                    afterDeferred = $q.defer();
                    ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
                });
                describe('and afterSave resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        afterDeferred.resolve();
                        updateDeferred = $q.defer();
                        ontologyManagerSvc.updateOntology.and.returnValue(updateDeferred.promise);
                    });
                    it('and updateOntology resolves', function() {
                        updateDeferred.resolve();
                        controller.removeChecked();
                        scope.$apply();
                        expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.type, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Checked changes removed');
                    });
                    it('and updateOntology rejects', function() {
                        updateDeferred.reject('error');
                        controller.removeChecked();
                        scope.$apply();
                        expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.type, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('and afterSave rejects', function() {
                    afterDeferred.reject('error');
                    controller.removeChecked();
                    scope.$apply();
                    expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('when saveChanges rejects', function() {
                saveDeferred.reject('error');
                controller.removeChecked();
                scope.$apply();
                expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('getTotalChecked should return the correct number', function() {
            controller.list = [{
                id: 'id1',
                additions: [{checked: true}, {}],
                deletions: [{checked: false}, {checked: true}]
            }];
            expect(controller.getTotalChecked()).toBe(2);
        });*/
        it('orderByIRI should call the correct method', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(controller.orderByIRI({id: 'id'})).toBe('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('id');
        });
    });
    it('should call update when the link is clicked', function() {
        ontologyStateSvc.listItem.upToDate = false;
        scope.$digest();
        spyOn(controller, 'update');
        var link = angular.element(element.querySelectorAll('block-content .text-center error-display a')[0]);
        link.triggerHandler('click');
        expect(controller.update).toHaveBeenCalled();
    });
});