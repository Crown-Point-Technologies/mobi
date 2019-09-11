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

routeConfig.$inject = ['$stateProvider', '$urlRouterProvider', 'uiSelectConfig'];

function routeConfig($stateProvider, $urlRouterProvider, uiSelectConfig) {
    // Sets proper style for the ui-select directives
    uiSelectConfig.theme = 'bootstrap';

    // Defaults to login
    $urlRouterProvider.otherwise('/home');

    // Sets the states
    $stateProvider
        .state('login', {
            url: '/login',
            views: {
                container: {
                    template: '<login-page></login-page>'
                }
            },
            data: {
                title: 'Login'
            }
        })
        .state('root', {
            abstract: true,
            resolve: {
                authenticate: authenticate
            }
        })
        .state('root.home', {
            url: '/home',
            views: {
                'container@': {
                    template: '<home-page></home-page>'
                }
            },
            data: {
                title: 'Home'
            }
        })
        .state('root.catalog', {
            url: '/catalog',
            views: {
                'container@': {
                    template: '<catalog-page></catalog-page>'
                }
            },
            data: {
                title: 'Catalog'
            }
        })
        .state('root.ontology-editor', {
            url: '/ontology-editor',
            views: {
                'container@': {
                    template: '<ontology-editor-page></ontology-editor-page>'
                }
            },
            data: {
                title: 'Ontology Editor'
            }
        })
        .state('root.mapper', {
            url: '/mapper',
            views: {
                'container@': {
                    template: '<mapper-page></mapper-page>'
                }
            },
            data: {
                title: 'Mapping Tool'
            }
        })
        .state('root.settings', {
            url: '/settings',
            views: {
                'container@': {
                    template: '<settings-page></settings-page>'
                }
            },
            data: {
                title: 'Settings'
            }
        })
        .state('root.discover', {
            url: '/discover',
            views: {
                'container@': {
                    template: '<discover-page></discover-page>'
                }
            },
            data: {
                title: 'Discover'
            }
        }).state('root.user-management', {
            url: '/user-management',
            views: {
                'container@': {
                    template: '<user-management-page></user-management-page>'
                }
            },
            data: {
                title: 'User Management'
            }
        }).state('root.datasets', {
            url: '/datasets',
            views: {
                'container@': {
                    template: '<datasets-page></datasets-page>'
                }
            },
            data: {
                title: 'Datasets'
            }
        }).state('root.merge-requests', {
            url: '/merge-requests',
            views: {
                'container@': {
                    template: '<merge-requests-page></merge-requests-page>'
                }
            },
            data: {
                title: 'Merge Requests'
            }
        });

    authenticate.$inject = ['loginManagerService'];

    function authenticate(loginManagerService) {
        return loginManagerService.isAuthenticated();
    }
}

export default routeConfig;