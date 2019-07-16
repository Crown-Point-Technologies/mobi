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
fdescribe('Custom Label component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.mutedText = '';
        this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('customLabel');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('mutedText should be one way bound', function() {
            this.controller.mutedText = 'Muted';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CUSTOM-LABEL');
            expect(this.element.querySelectorAll('.control-label').length).toEqual(1);
        });
        it('with small text if there is muted text', function() {
            expect(this.element.find('small').length).toBe(0);
            scope.mutedText = 'Muted';
            scope.$digest();
            expect(this.element.find('small').length).toBe(1);
        });
    });
});