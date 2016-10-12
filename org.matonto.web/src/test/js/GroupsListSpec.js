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
describe('Groups List directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('groupsList');
        mockUserManager();
        mockLoginManager();
        mockUserState();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<groups-list></groups-list>'))(scope);
            scope.$digest();
            controller = this.element.controller('groupsList');
        });
        it('should set the selected group when clicked', function() {
            var group = {};
            controller.onClick(group);
            expect(userStateSvc.selectedGroup).toEqual(group);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            userStateSvc.filteredGroupList = false;
            this.element = $compile(angular.element('<groups-list></groups-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('groups-list')).toBe(true);
        });
        it('depending on how many groups there are', function() {
            expect(this.element.find('li').length).toBe(0);

            userManagerSvc.groups = [{name: 'group', members: []}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length);
        });
        it('depending on which group is selected', function() {
            var group = {name: 'group', members: []};
            userManagerSvc.groups = [group];
            scope.$digest();
            var groupLink = angular.element(this.element.querySelectorAll('li a')[0]);
            expect(groupLink.hasClass('active')).toBe(false);

            userStateSvc.selectedGroup = group;
            scope.$digest();
            expect(groupLink.hasClass('active')).toBe(true);
        });
        it('depending on whether the list should be filtered', function() {
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.groups = [{name: 'group1', members: []}, {name: 'group2', members: [loginManagerSvc.currentUser]}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length);

            userStateSvc.filteredGroupList = true;
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length - 1);
        });
    });
    it('should call onClick when a group is clicked', function() {
        var group = {name: 'group', members: []};
        userStateSvc.filteredGroupList = false;
        userManagerSvc.groups = [group];
        var element = $compile(angular.element('<groups-list></groups-list>'))(scope);
        scope.$digest();
        controller = element.controller('groupsList');
        spyOn(controller, 'onClick');

        var groupLink = angular.element(element.querySelectorAll('li a')[0]);
        groupLink.triggerHandler('click');
        expect(controller.onClick).toHaveBeenCalledWith(group);
    });
});