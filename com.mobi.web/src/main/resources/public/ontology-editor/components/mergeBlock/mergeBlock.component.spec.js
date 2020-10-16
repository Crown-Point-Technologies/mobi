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
import {
    mockUtil,
    mockOntologyState,
    mockCatalogManager,
    mockPrefixes
} from '../../../../../../test/js/Shared';

describe('Merge Block component', function() {
    var $compile, scope, $q, ontologyStateSvc, util, catalogManagerSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockUtil();
        mockOntologyState();
        mockCatalogManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        ontologyStateSvc.listItem.ontologyRecord.branchId = 'branchId';
        ontologyStateSvc.listItem.branches = [{'@id': 'branchId'}];
        ontologyStateSvc.listItem.merge.checkbox = false;
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        this.element = $compile(angular.element('<merge-block></merge-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        util = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-BLOCK');
            expect(this.element.querySelectorAll('.merge-block').length).toEqual(1);
        });
        _.forEach(['branch-select', 'checkbox'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toEqual(1);
            });
        });
        it('with a .merge-message', function() {
            expect(this.element.querySelectorAll('.merge-message').length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container .btn');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toEqual(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on whether the branch is a UserBranch', function() {
            expect(this.element.find('checkbox').length).toEqual(1);

            ontologyStateSvc.listItem.userBranch = true;
            scope.$digest();
            expect(this.element.find('checkbox').length).toEqual(0);
        });
        it('depending on whether the branch is the master branch', function() {
            expect(this.element.find('checkbox').length).toEqual(1);

            this.controller.branchTitle = 'MASTER';
            ontologyStateSvc.listItem.userBranch = true;
            scope.$digest();
            expect(this.element.find('checkbox').length).toEqual(0);
        });
        it('depending on whether a target has been selected', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(this.element.find('commit-difference-tabset').length).toEqual(0);
            expect(button.attr('disabled')).toBeTruthy();

            ontologyStateSvc.listItem.merge.target = {};
            scope.$digest();
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should collect differences when changing the target branch', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.merge.difference = {};
            });
            it('unless the target is empty', function() {
                this.controller.changeTarget();
                expect(ontologyStateSvc.listItem.merge.target).toBeUndefined();
                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.merge.difference).toBeUndefined();
            });
            describe('when target is not empty', function() {
                beforeEach(function() {
                    this.branch = {'@id': 'target'};
                });
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when({'http://mobi.com/ontologies/catalog#head': [{'@id': 'targetHead'}]}));
                    ontologyStateSvc.getMergeDifferences.and.returnValue($q.reject('Error'));
                    this.controller.changeTarget(this.branch);
                    scope.$apply();
                    expect(ontologyStateSvc.listItem.merge.target).toEqual(this.branch);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalled();
                    expect(ontologyStateSvc.getMergeDifferences).toHaveBeenCalledWith('', '', catalogManagerSvc.differencePageSize, 0);
                    expect(util.createErrorToast).toHaveBeenCalledWith('Error');
                    expect(ontologyStateSvc.listItem.merge.difference).toBeUndefined();
                });
                it('successfully', function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when({'http://mobi.com/ontologies/catalog#head': [{'@id': 'targetHead'}]}));
                    this.controller.changeTarget(this.branch);
                    scope.$apply();
                    expect(ontologyStateSvc.listItem.merge.target).toEqual(this.branch);
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalled();
                    expect(ontologyStateSvc.getMergeDifferences).toHaveBeenCalledWith('', '', catalogManagerSvc.differencePageSize, 0);
                    expect(util.createErrorToast).not.toHaveBeenCalled();
                });
            });
        });
        describe('should submit the merge', function() {
            it('unless attemptMerge rejects', function() {
                ontologyStateSvc.attemptMerge.and.returnValue($q.reject('Error message'));
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.attemptMerge).toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                expect(util.createSuccessToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.cancelMerge).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual('Error message');
            });
            it('if attemptMerge resolves', function() {
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.attemptMerge).toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                expect(util.createSuccessToast).toHaveBeenCalled();
                expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
                expect(this.controller.error).toEqual('');
            });
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(this.controller, 'submit');
        var button = angular.element(this.element.querySelectorAll('.btn-container .btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call the correct method when the button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container .btn:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
    });
});