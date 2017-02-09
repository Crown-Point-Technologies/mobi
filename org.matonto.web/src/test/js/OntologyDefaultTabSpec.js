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
describe('Ontology Default Tab directive', function() {
    var $compile,
        scope,
        element,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyDefaultTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        element = $compile(angular.element('<ontology-default-tab></ontology-default-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-default-tab')).toBe(true);
        });
        it('depending on whether a new ontology is being created', function() {
            expect(element.find('open-ontology-tab').length).toBe(1);
            expect(element.find('new-ontology-tab').length).toBe(0);

            ontologyStateSvc.showNewTab = true;
            scope.$digest();
            expect(element.find('open-ontology-tab').length).toBe(0);
            expect(element.find('new-ontology-tab').length).toBe(1);
        });
        it('depending on whether an ontology is being uploaded', function() {
            expect(element.find('open-ontology-tab').length).toBe(1);
            expect(element.find('upload-ontology-tab').length).toBe(0);

            ontologyStateSvc.showUploadTab = true;
            scope.$digest();
            expect(element.find('open-ontology-tab').length).toBe(0);
            expect(element.find('upload-ontology-tab').length).toBe(1);
        });
    });
});