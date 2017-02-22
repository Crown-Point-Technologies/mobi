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
describe('Radio Button directive', function() {
    var $compile, $timeout, scope, element, isolatedScope;

    beforeEach(function() {
        module('templates');
        module('radioButton');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.ngModel = false;
        scope.value = 0;
        scope.displayText = '';
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.inline = false;

        element = $compile(angular.element('<radio-button ng-model="ngModel" value="value" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()" inline="inline"></radio-button>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
    });

    it('calls changeEvent if value of radio button is changed', function() {
        element.find('input')[0].click();
        scope.$digest();
        $timeout.flush();
        expect(scope.changeEvent).toHaveBeenCalled();
    });
    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            isolatedScope.bindModel = true;
            scope.$digest();
            expect(scope.ngModel).toEqual(true);
        });
        it('value should be one way bound', function() {
            isolatedScope.value = 1;
            scope.$digest();
            expect(scope.value).toEqual(0);
        });
        it('displayText should be one way bound', function() {
            isolatedScope.displayText = 'abc';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('isDisabledWhen should be one way bound', function() {
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toBe(false);
        });
        it('inline should be one way bound', function() {
            isolatedScope.inline = true;
            scope.$digest();
            expect(scope.inline).toBe(false);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            isolatedScope.changeEvent();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a label and radio button', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('form-group'));
            var labelList = element.querySelectorAll('label');
            var inputList = element.querySelectorAll('input');
            expect(labelList.length).toBe(1);
            expect(inputList.length).toBe(1);
            var input = inputList[0];
            expect(input.type).toBe('radio');
        });
        it('when inline is false', function() {
            expect(element.querySelectorAll('label.radio-inline').length).toEqual(0);
            expect(element.hasClass('wrapper-inline')).toBe(false);
        });
        it('when inline is true', function() {
            scope.inline = true;
            scope.$digest();
            expect(element.querySelectorAll('label.radio-inline').length).toEqual(1);
            expect(element.hasClass('wrapper-inline')).toBe(true);
        });
    });
});