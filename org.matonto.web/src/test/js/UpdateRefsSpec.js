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
describe('Update Refs service', function() {
    var updateRefsSvc,
        responseObjSvc;

    beforeEach(function() {
        module('responseObj');
        module('updateRefs');

        module(function($provide) {
            $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
                return {
                    begin: 'aaa',
                    then: '/',
                    end: '1'
                }
            }));
        });

        inject(function(updateRefsService, _responseObj_) {
            updateRefsSvc = updateRefsService;
            responseObjSvc = _responseObj_;
            spyOn(responseObjSvc, 'getItemIri').and.callFake(function(obj) {
                return _.get(obj, 'iri', '');
            });
            spyOn(responseObjSvc, 'validateItem').and.callFake(function(obj) {
                return typeof obj === 'object';
            });
        });
    });

    it('should replace all instances of a key in an object with the new key', function() {
        var result,
            obj = {
                'test/0': 0,
                'id': 'test/0',
                props: [
                    {
                        'test/0': 1
                    }
                ],
                refs: ['test/0'],
                items: [
                    {
                        iri: 'test/0',
                        namespace: 'test/',
                        localName: '0'
                    }
                ]
            },
            result = {
                'aaa/1': 0,
                'id': 'aaa/1',
                props: [
                    {
                        'aaa/1': 1
                    }
                ],
                refs: ['aaa/1'],
                items: [
                    {
                        iri: 'test/0',
                        namespace: 'aaa/',
                        localName: '1'
                    }
                ]
            };
        updateRefsSvc.update(obj, 'test/0', 'aaa/1');
        expect(obj).toEqual(result);
    });
    it('should remove all objects that reference the provided string', function() {
        var obj = {
            'id1': 'remove',
            arr: [
                {
                    'id2': 'remove'
                }
            ],
            arr2: [
                {
                    'id3': 'remove'
                },
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['remove', 'no-remove'],
            arr4: ['remove'],
            'id5': {
                'id6': 'remove'
            }
        };
        var result = {
            arr2: [
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['no-remove']
        };
        updateRefsSvc.remove(obj, 'remove');
        expect(obj).toEqual(result);
    });
});