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
    mockComponent,
    mockMergeRequestManager,
    mockUtil
} from '../../../../../../test/js/Shared';

describe('Merge Request Tabset component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('merge-requests');
        mockComponent('merge-requests', 'mergeRequestDiscussion');
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.request = {difference: {additions: [], deletions: []}};
        scope.updateRequest = jasmine.createSpy('updateRequest');
        this.element = $compile(angular.element('<merge-request-tabset request="request" parent-id="parentId" update-request="updateRequest(value)"></merge-request-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('request should be one way bound', function() {
            var copy = angular.copy(this.controller.request);
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual(copy);
        });
        it('updateRequest should be called in the parent scope', function() {
            this.controller.updateRequest({value: this.controller.request});
            expect(scope.updateRequest).toHaveBeenCalledWith(this.controller.request);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-REQUEST-TABSET');
            expect(this.element.querySelectorAll('.merge-request-tabset').length).toEqual(1);
        });
        _.forEach(['material-tabset', 'merge-request-discussion', 'commit-history-table', 'commit-changes-display'], tag => {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toEqual(1);
            });
        });
        it('with material-tabs', function() {
            expect(this.element.find('material-tab').length).toEqual(3);
        });
        it('depending on whether the request has any changes', function() {
            expect(this.element.find('info-message').length).toEqual(1);

            this.controller.request.difference.additions = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
        });
    });
});