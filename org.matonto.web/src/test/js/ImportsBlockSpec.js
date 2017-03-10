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
describe('Imports Block directive', function() {
    var $compile, scope, element, ontologyStateSvc, prefixes, controller, ontologyManagerSvc, propertyManagerSvc, $q;

    beforeEach(function() {
        module('templates');
        module('importsBlock');
        mockOntologyState();
        mockPrefixes();
        mockUtil();
        mockPropertyManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyManagerService_, _propertyManagerService_, _$q_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            $q = _$q_;
            util = _utilService_;
        });

        ontologyStateSvc.selected[prefixes.owl + 'imports'] = [];
        element = $compile(angular.element('<imports-block></imports-block>'))(scope);
        scope.$digest();
        controller = element.controller('importsBlock');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('imports-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with an a', function() {
            expect(element.querySelectorAll('a.pull-right').length).toBe(1);
        });
        it('with a imports-overlay', function() {
            expect(element.find('imports-overlay').length).toBe(0);
            element.controller('importsBlock').showNewOverlay = true;
            scope.$apply();
            expect(element.find('imports-overlay').length).toBe(1);
        });
        it('depending on whether confirmation is open', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);
            element.controller('importsBlock').showRemoveOverlay = true;
            scope.$apply();
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
        it('depending on the length of the selected ontology imports', function() {
            expect(element.querySelectorAll('.text-info.message').length).toBe(1);
            expect(element.querySelectorAll('.import').length).toBe(0);

            ontologyStateSvc.selected[prefixes.owl + 'imports'] = [{'@id': 'import'}];
            scope.$digest();
            expect(element.querySelectorAll('.text-info.message').length).toBe(0);
            expect(element.querySelectorAll('.import').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('setupRemove should set the correct variables', function() {
            controller.setupRemove('url');
            expect(controller.url).toBe('url');
            expect(controller.showRemoveOverlay).toBe(true);
        });
        describe('remove calls the proper functions', function() {
            var saveDeferred;
            beforeEach(function() {
                controller.url = 'url';
                saveDeferred = $q.defer();
                ontologyManagerSvc.saveChanges.and.returnValue(saveDeferred.promise);
                controller.remove();
            });
            describe('when save changes resolves', function() {
                var afterDeferred;
                beforeEach(function() {
                    saveDeferred.resolve();
                    afterDeferred = $q.defer();
                    ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
                });
                describe('when after save resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        afterDeferred.resolve();
                        updateDeferred = $q.defer();
                        ontologyManagerSvc.updateOntology.and.returnValue(updateDeferred.promise);
                    });
                    it('when update ontology resolves', function() {
                        updateDeferred.resolve();
                        scope.$apply();
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                        expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.selected, prefixes.owl + 'imports', controller.index);
                        expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.type, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(controller.showRemoveOverlay).toBe(false);
                    });
                    it('when update ontology rejects', function() {
                        updateDeferred.reject('error');
                        scope.$apply();
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                        expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.selected, prefixes.owl + 'imports', controller.index);
                        expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.commitId, ontologyStateSvc.listItem.type, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(controller.error).toBe('error');
                    });
                });
                it('when after save rejects', function() {
                    afterDeferred.reject('error');
                    scope.$apply();
                    expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                    expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                    expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.selected, prefixes.owl + 'imports', controller.index);
                    expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(controller.error).toBe('error');
                });
            });
            it('when save changes rejects', function() {
                saveDeferred.reject('error');
                scope.$apply();
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                expect(ontologyManagerSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.selected, prefixes.owl + 'imports', controller.index);
                expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                expect(controller.error).toBe('error');
            });
        });
        it('get should return the correct variable', function() {
            expect(controller.get({'@id': 'id'})).toBe('id');
            expect(controller.get()).toBeUndefined();
        });
    });
});