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
describe('Login controller', function() {
    var $controller,
        scope,
        loginManagerSvc,
        $q,
        controller;

    beforeEach(function() {
        module('login');
        mockLoginManager();

        inject(function(_$rootScope_, _$controller_, _loginManagerService_, _$q_) {
            scope = _$rootScope_;
            $controller = _$controller_;
            loginManagerSvc = _loginManagerService_;
            $q = _$q_;
        });

        controller = $controller('LoginController', {});
    });

    describe('correctly validates a login combination', function() {
        beforeEach(function() {
            controller.form = {
                username: 'user',
                password: ''
            };
        });
        it('unless an error occurs', function() {
            loginManagerSvc.login.and.returnValue($q.reject('Error message'));
            controller.login();
            scope.$digest();
            expect(loginManagerSvc.login).toHaveBeenCalledWith(controller.form.username, controller.form.password);
            expect(controller.errorMessage).toBe('Error message');
        });
        it('successfully', function() {
            controller.login();
            scope.$digest();
            expect(loginManagerSvc.login).toHaveBeenCalledWith(controller.form.username, controller.form.password);
            expect(controller.errorMessage).toBe('');
        });
    });
});