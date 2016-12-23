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
describe('Custom Header directive', function() {
    var $compile,
        scope,
        catalogStateSvc,
        catalogManagerSvc,
        ontologyManagerSvc,
        ontologyStateSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        sparqlManagerSvc,
        loginManagerSvc,
        userStateSvc,
        userManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('customHeader');
        mockCatalogState();
        mockCatalogManager();
        mockOntologyManager();
        mockOntologyState();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockSparqlManager();
        mockLoginManager();
        mockUserState();
        mockUserManager();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_, _catalogManagerService_, _ontologyManagerService_, _ontologyStateService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _sparqlManagerService_, _loginManagerService_, _userStateService_, _userManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            sparqlManagerSvc = _sparqlManagerService_;
            loginManagerSvc = _loginManagerService_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.pageTitle = '';
            this.element = $compile(angular.element('<custom-header page-title="pageTitle"></custom-header>'))(scope);
            scope.$digest();
        });
        it('pageTitle should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.pageTitle = 'Title';
            scope.$digest();
            expect(scope.pageTitle).toEqual('');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.pageTitle = '';
            this.element = $compile(angular.element('<custom-header page-title="pageTitle"></custom-header>'))(scope);
            scope.$digest();
            controller = this.element.controller('customHeader');
        });
        it('should log out of the application', function() {
            controller.logout();
            expect(catalogStateSvc.reset).toHaveBeenCalled();
            expect(ontologyStateSvc.reset).toHaveBeenCalled();
            expect(ontologyManagerSvc.reset).toHaveBeenCalled();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mappingManagerSvc.reset).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
            expect(sparqlManagerSvc.reset).toHaveBeenCalled();
            expect(loginManagerSvc.logout).toHaveBeenCalled();
            expect(userStateSvc.reset).toHaveBeenCalled();
            expect(userManagerSvc.reset).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.pageTitle = '';
            this.element = $compile(angular.element('<custom-header page-title="pageTitle"></custom-header>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('main-header')).toBe(true);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
        });
    });
});