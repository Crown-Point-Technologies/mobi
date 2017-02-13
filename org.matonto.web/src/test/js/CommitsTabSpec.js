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
describe('Commits Tab directive', function() {
    var $compile, scope, $q, element;

    beforeEach(function() {
        module('templates');
        module('commitsTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<commits-tab></commits-tab>'))(scope);
        scope.$digest();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commits-tab')).toBe(true);
        });
        _.forEach(['block', 'commit-history-table', 'h4'], function(item) {
            it('for ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('for .col-xs-8', function() {
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
    });
});
