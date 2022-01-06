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
    mockUtil,
    mockPrefixes,
    injectRestPathConstant,
    flushAndVerify
} from '../../../../../test/js/Shared';

describe('Policy Enforcement service', function() {
    var policyEnforcementSvc, $httpBackend, utilSvc, $q;

    beforeEach(function() {
        angular.mock.module('shared');
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();

        inject(function(policyEnforcementService, _utilService_, _$httpBackend_, _$q_) {
            policyEnforcementSvc = policyEnforcementService;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.jsonRequest = {
            'resourceId':'urn:test',
            'actionId':'urn:test',
            'actionAttrs': {
                'urn:test':'urn:test'
            },
            'resourceAttrs': {
               'urn:test':'urn:test'
            },
            'subjectAttrs': {
              'urn:test':'urn:test'
            }
        };
    });

    afterEach(function() {
        policyEnforcementSvc = null;
        $httpBackend = null;
        utilSvc = null;
        $q = null;
    });

    describe('should evaluate a request', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/pep').respond(400, null, null, 'Error Message');
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('when resolved', function() {
            $httpBackend.expectPOST('/mobirest/pep', this.jsonRequest).respond(200);
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('with additional fields when resolved', function() {
            var copy = JSON.parse(JSON.stringify(this.jsonRequest));
            $httpBackend.expectPOST('/mobirest/pep', copy).respond(200);
            this.jsonRequest.additionalField = 'urn:test';
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            expect(policyEnforcementSvc.evaluateRequest)
            flushAndVerify($httpBackend);
        });
    });
});
