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
    mockCatalogManager,
    mockCatalogState,
    mockDatasetManager,
    mockDatasetState,
    mockDelimitedManager,
    mockDiscoverState,
    mockMapperState,
    mockMergeRequestsState,
    mockOntologyManager,
    mockOntologyState,
    mockSettingManager,
    mockSparqlManager,
    mockStateManager,
    mockUserManager,
    mockUserState,
    mockYasguiService,
    injectRestPathConstant,
    flushAndVerify,
    createQueryString
} from '../../../../../test/js/Shared';

describe('Login Manager service', function() {
    var loginManagerSvc, $httpBackend, state, scope, $q, catalogManagerSvc, catalogStateSvc, datasetManagerSvc,
        datasetStateSvc, delimitedManagerSvc, discoverStateSvc, mapperStateSvc, mergeRequestsStateSvc, ontologyManagerSvc,
        ontologyStateSvc, settingManagerSvc, sparqlManagerSvc, stateManagerSvc, userManagerSvc, userStateSvc, yasguiSvc;


    beforeEach(function() {
        angular.mock.module('shared');
        mockCatalogManager();
        mockCatalogState();
        mockDatasetManager();
        mockDatasetState();
        mockDelimitedManager();
        mockDiscoverState();
        mockMapperState();
        mockMergeRequestsState();
        mockSettingManager();
        mockOntologyManager();
        mockOntologyState();
        mockSparqlManager();
        mockStateManager();
        mockUserManager();
        mockUserState();
        mockYasguiService();
        injectRestPathConstant();
        
        angular.mock.module(function($provide) {
            $provide.service('$state', function() {
                this.go = jasmine.createSpy('go');
            });
        });

        inject(function(loginManagerService, _$httpBackend_, _$state_, _$rootScope_, _$q_, _catalogManagerService_,
                        _catalogStateService_, _datasetManagerService_, _datasetStateService_, _delimitedManagerService_,
                        _discoverStateService_, _mapperStateService_, _mergeRequestsStateService_, _ontologyManagerService_,
                        _ontologyStateService_, _settingManagerService_, _sparqlManagerService_, _stateManagerService_, _userManagerService_,
                         _userStateService_,_yasguiService_) {
            loginManagerSvc = loginManagerService;
            $httpBackend = _$httpBackend_;
            state = _$state_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            datasetManagerSvc = _datasetManagerService_;
            datasetStateSvc = _datasetStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            discoverStateSvc = _discoverStateService_;
            mapperStateSvc = _mapperStateService_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            settingManagerSvc = _settingManagerService_;
            sparqlManagerSvc = _sparqlManagerService_;
            stateManagerSvc = _stateManagerService_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            yasguiSvc = _yasguiService_;
        });
    });

    afterEach(function() {
        loginManagerSvc = null;
        $httpBackend = null;
        state = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        datasetManagerSvc = null;
        datasetStateSvc = null;
        delimitedManagerSvc = null;
        discoverStateSvc = null;
        mapperStateSvc = null;
        mergeRequestsStateSvc = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        settingManagerSvc = null;
        sparqlManagerSvc = null;
        stateManagerSvc = null;
        userManagerSvc = null;
        userStateSvc = null;
        yasguiSvc = null;
    });

    describe('should log into an account', function() {
        beforeEach(function() {
            this.params = {
                password: 'password',
                username: 'user'
            };
        });
        it('unless the credentials are wrong', function() {
            $httpBackend.expectPOST('/mobirest/session' + createQueryString(this.params)).respond(401, "");
            loginManagerSvc.login(this.params.username, this.params.password)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toBe('This email/password combination is not correct.');
                });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/session' + createQueryString(this.params)).respond(400, "");
            loginManagerSvc.login(this.params.username, this.params.password)
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toBe('An error has occurred. Please try again later.');
                });
            flushAndVerify($httpBackend);
        });
        it('unless something else went wrong', function() {
            $httpBackend.expectPOST('/mobirest/session' + createQueryString(this.params)).respond(201, "");
            loginManagerSvc.login(this.params.username, this.params.password)
                .then(response => {
                    expect(response).not.toBe(true);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(state.go).not.toHaveBeenCalled();
            expect(loginManagerSvc.currentUser).toBeFalsy();
            expect(loginManagerSvc.currentUserIRI).toBeFalsy();
        });
        it('unless the account is anonymous', function() {
            $httpBackend.expectPOST('/mobirest/session' + createQueryString(this.params)).respond(200, "");
            loginManagerSvc.login(this.params.username, this.params.password)
                .then(response => {
                    expect(response).not.toBe(true);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(state.go).not.toHaveBeenCalled();
            expect(loginManagerSvc.currentUser).toBeFalsy();
            expect(loginManagerSvc.currentUserIRI).toBeFalsy();
        });
        it('if everything was passed correctly', function() {
            var params = this.params;
            var user = {
                iri: 'userIRI',
                username: 'user'
            };
            userManagerSvc.getUser.and.returnValue($q.when(user));
            $httpBackend.expectPOST('/mobirest/session' + createQueryString(params)).respond(200, params.username);
            loginManagerSvc.login(params.username, params.password)
                .then(response => {
                    expect(response).toBe(true);
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(state.go).toHaveBeenCalledWith('root.home');
            expect(loginManagerSvc.currentUser).toBe(user.username);
            expect(loginManagerSvc.currentUserIRI).toBe(user.iri);
        });
    });
    it('should log a user out', function() {
        $httpBackend.expectDELETE('/mobirest/session').respond(200, "");
        loginManagerSvc.logout();
        flushAndVerify($httpBackend);
        expect(datasetStateSvc.reset).toHaveBeenCalled();
        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        expect(discoverStateSvc.reset).toHaveBeenCalled();
        expect(mapperStateSvc.initialize).toHaveBeenCalled();
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
        expect(mergeRequestsStateSvc.reset).toHaveBeenCalled();
        expect(ontologyManagerSvc.reset).toHaveBeenCalled();
        expect(ontologyStateSvc.reset).toHaveBeenCalled();
        expect(sparqlManagerSvc.reset).toHaveBeenCalled();
        expect(userStateSvc.reset).toHaveBeenCalled();
        expect(catalogStateSvc.reset).toHaveBeenCalled();
        expect(yasguiSvc.reset).toHaveBeenCalled();
        expect(loginManagerSvc.currentUser).toBe('');
        expect(loginManagerSvc.currentUserIRI).toBe('');
        expect(state.go).toHaveBeenCalledWith('login');
    });
    describe('should get the current login', function() {
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/session').respond(400, "");
            loginManagerSvc.getCurrentLogin()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual("");
                });
            flushAndVerify($httpBackend);
        });
        it('unless something else went wrong', function() {
            $httpBackend.expectGET('/mobirest/session').respond(201, "");
            loginManagerSvc.getCurrentLogin()
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual("");
                });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/session').respond(200, "");
            loginManagerSvc.getCurrentLogin()
                .then(response => {
                    expect(response).toEqual("");
                }, () => {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should correctly test authentication', function() {
        it('unless an error happened', function() {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.reject(""));
            loginManagerSvc.isAuthenticated()
                .then(response => {
                    expect(response).toBeUndefined();
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(loginManagerSvc.currentUser).toBe('');
            expect(loginManagerSvc.currentUserIRI).toBe('');
            expect(state.go).toHaveBeenCalledWith('login');
        });
        it('unless no one is logged in', function() {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.resolve(""));
            loginManagerSvc.isAuthenticated()
                .then(() => {
                    expect(response).toBeUndefined();
                }, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(loginManagerSvc.currentUser).toBe('');
            expect(loginManagerSvc.currentUserIRI).toBe('');
            expect(state.go).toHaveBeenCalledWith('login');
        });
        describe('if a user is logged in', function() {
            beforeEach(function() {
                this.user = {
                    iri: 'userIRI',
                    username: 'user'
                };
                spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.resolve('user'));
                userManagerSvc.getUser.and.returnValue($q.when(this.user));
            });
            it('and this is the first time the method is called', function() {
                loginManagerSvc.isAuthenticated()
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(loginManagerSvc.currentUser).toBe('user');
                expect(loginManagerSvc.currentUserIRI).toBe('userIRI');
                expect(catalogManagerSvc.initialize).toHaveBeenCalled();
                expect(catalogStateSvc.initialize).toHaveBeenCalled();
                expect(ontologyManagerSvc.initialize).toHaveBeenCalled();
                expect(ontologyStateSvc.initialize).toHaveBeenCalled();
                expect(mergeRequestsStateSvc.initialize).toHaveBeenCalled();
                expect(userManagerSvc.initialize).toHaveBeenCalled();
                expect(userManagerSvc.getUser).toHaveBeenCalledWith('user');
                expect(stateManagerSvc.initialize).toHaveBeenCalled();
                expect(datasetManagerSvc.initialize).toHaveBeenCalled();
                expect(state.go).not.toHaveBeenCalled();
            });
            it('and this is not the first time the method is called', function() {
                loginManagerSvc.weGood = true;
                loginManagerSvc.isAuthenticated()
                    .then(_.noop, () => {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(loginManagerSvc.currentUser).toBe('user');
                expect(loginManagerSvc.currentUserIRI).toBe('userIRI');
                expect(catalogManagerSvc.initialize).not.toHaveBeenCalled();
                expect(catalogStateSvc.initialize).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.initialize).not.toHaveBeenCalled();
                expect(ontologyStateSvc.initialize).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.initialize).not.toHaveBeenCalled();
                expect(userManagerSvc.getUser).toHaveBeenCalledWith('user');
                expect(userManagerSvc.initialize).toHaveBeenCalled();
                expect(stateManagerSvc.initialize).toHaveBeenCalled();
                expect(datasetManagerSvc.initialize).not.toHaveBeenCalled();
                expect(state.go).not.toHaveBeenCalled();
            });
        });
    });
});
