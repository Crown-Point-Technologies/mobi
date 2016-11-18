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
describe('User Management Overlays directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        $q,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('userManagementOverlays');
        mockUserState();
        mockUserManager();

        inject(function(_userManagerService_, _userStateService_, _$timeout_, _$q_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            $q = _$q_;
            $timeout = _$timeout_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<user-management-overlays></user-management-overlays>'))(scope);
            scope.$digest();
            controller = this.element.controller('userManagementOverlays');
        });
        describe('should delete', function() {
            beforeEach(function() {
                userStateSvc.displayDeleteConfirm = true;
            });
            describe('a group', function() {
                beforeEach(function() {
                    this.group = userStateSvc.selectedGroup = {title: 'group'};
                });
                it('unless an error occurs', function() {
                    userManagerSvc.deleteGroup.and.returnValue($q.reject('Error message'));
                    controller.delete();
                    $timeout.flush();
                    expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    var groupName = userStateSvc.selectedGroup.title;
                    controller.delete();
                    $timeout.flush();
                    expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                    expect(controller.errorMessage).toBe('');
                    expect(userStateSvc.displayDeleteConfirm).toBe(false);
                    expect(userStateSvc.selectedGroup).toBe(undefined);
                });
            });
            describe('a user', function() {
                beforeEach(function() {
                    this.user = userStateSvc.selectedUser = {username: 'user'};
                });
                it('unless an error occurs', function() {
                    userManagerSvc.deleteUser.and.returnValue($q.reject('Error message'));
                    controller.delete();
                    $timeout.flush();
                    expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    var username = userStateSvc.selectedUser.username;
                    controller.delete();
                    $timeout.flush();
                    expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                    expect(controller.errorMessage).toBe('');
                    expect(userStateSvc.displayDeleteConfirm).toBe(false);
                    expect(userStateSvc.selectedUser).toBe(undefined);
                });
            });
        });
        describe('should remove a group member', function() {
            beforeEach(function() {
                userStateSvc.displayRemoveMemberConfirm = true;
                this.memberName = userStateSvc.memberName = 'user';
                this.group = userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteUserGroup.and.returnValue($q.reject('Error message'));
                controller.removeMember();
                $timeout.flush();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('unless an error occurs', function() {
                controller.removeMember();
                $timeout.flush();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.memberName).toBe('');
                expect(userStateSvc.selectedGroup).toEqual(this.group);
                expect(userStateSvc.displayRemoveMemberConfirm).toBe(false);
            });
        })
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<user-management-overlays></user-management-overlays>'))(scope);
            scope.$digest();
        });
        it('depending on whether a user is being created', function() {
            userStateSvc.displayCreateUserOverlay = true;
            scope.$digest();
            expect(this.element.find('create-user-overlays').length).toBe(1);

            userStateSvc.displayCreateUserOverlay = false;
            scope.$digest();
            expect(this.element.find('create-user-overlays').length).toBe(0);
        });
        it('depending on whether a group is being created', function() {
            userStateSvc.displayCreateGroupOverlay = true;
            scope.$digest();
            expect(this.element.find('create-group-overlay').length).toBe(1);

            userStateSvc.displayCreateGroupOverlay = false;
            scope.$digest();
            expect(this.element.find('create-group-overlay').length).toBe(0);
        });
        it('depending on whether a password is being changed', function() {
            userStateSvc.displayChangePasswordOverlay = true;
            scope.$digest();
            expect(this.element.find('change-password-overlay').length).toBe(1);

            userStateSvc.displayChangePasswordOverlay = false;
            scope.$digest();
            expect(this.element.find('change-password-overlay').length).toBe(0);
        });
        it('depending on whether a user profile is being edited', function() {
            userStateSvc.displayEditUserProfileOverlay = true;
            scope.$digest();
            expect(this.element.find('edit-user-profile-overlay').length).toBe(1);

            userStateSvc.displayEditUserProfileOverlay = false;
            scope.$digest();
            expect(this.element.find('edit-user-profile-overlay').length).toBe(0);
        });
        it('depending on whether group information is being edited', function() {
            userStateSvc.displayEditGroupInfoOverlay = true;
            scope.$digest();
            expect(this.element.find('edit-group-info-overlay').length).toBe(1);

            userStateSvc.displayEditGroupInfoOverlay = false;
            scope.$digest();
            expect(this.element.find('edit-group-info-overlay').length).toBe(0);
        });
        it('depending on whether deleting an user or group should be confirmed', function() {
            userStateSvc.displayDeleteConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-confirm')).toBe(true);

            userStateSvc.displayDeleteConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether removing a group member should be confirmed', function() {
            userStateSvc.displayRemoveMemberConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('remove-member-confirm')).toBe(true);

            userStateSvc.displayRemoveMemberConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        describe('depending on whether an error occured', function() {
            beforeEach(function() {
                controller = this.element.controller('userManagementOverlays');
                controller.errorMessage = 'Error message';
            })
            it('when deleting a user or group', function() {
                userStateSvc.displayDeleteConfirm = true;
                scope.$digest();
                expect(this.element.find('error-display').length).toBe(1);
            });
            it('when removing a group member', function() {
                userStateSvc.displayRemoveMemberConfirm = true;
                scope.$digest();
                expect(this.element.find('error-display').length).toBe(1);
            });
        });
    });
});
