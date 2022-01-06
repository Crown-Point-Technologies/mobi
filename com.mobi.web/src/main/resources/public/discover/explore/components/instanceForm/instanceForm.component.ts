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
import * as angular from 'angular';
import { filter, some, forEach, concat, includes, uniq, remove, map, join, find, get, flatten } from 'lodash';

import './instanceForm.component.scss';

const template = require('./instanceForm.component.html');

/**
 * @ngdoc component
 * @name explore.component:instanceForm
 * @requires shared.filter:splitIRIFilter
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 * @requires discover.service:exploreService
 * @requires shared.service:prefixes
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:modalService
 *
 * @description
 * `instanceForm` is a component that creates a form with the complete list of properties associated with the
 * {@link shared.service:discoverStateService selected instance} in an editable format. Also provides a
 * way to {@link shared.component:editIriOverlay edit the instance IRI} after acknowledging the danger.
 * If there are required properties not set on the instance, the provided `isValid` variable is set to false.
 *
 * @param {string} header The configurable header for the form
 * @param {boolean} isValid Whether all the required properties for the instance are set
 * @param {Function} changeEvent A function to be called when the value of isValid changes. Expects an argument
 * called `value` and should update the value of `isValid`.
 */
const instanceFormComponent = {
    template,
    bindings: {
        header: '<',
        isValid: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: instanceFormComponentCtrl
};

instanceFormComponentCtrl.$inject = ['$q', '$filter', 'discoverStateService', 'utilService', 'exploreService', 'prefixes', 'REGEX', 'exploreUtilsService', 'modalService'];

function instanceFormComponentCtrl($q, $filter, discoverStateService, utilService, exploreService, prefixes, REGEX, exploreUtilsService, modalService) {
    var dvm = this;
    var es = exploreService;
    dvm.ds = discoverStateService;
    dvm.util = utilService;
    dvm.properties = [{
        propertyIRI: prefixes.dcterms + 'description',
        type: 'Data'
    }, {
        propertyIRI: prefixes.dcterms + 'title',
        type: 'Data'
    }, {
        propertyIRI: prefixes.rdfs + 'comment',
        type: 'Data'
    }, {
        propertyIRI: prefixes.rdfs + 'label',
        type: 'Data'
    }];
    dvm.reificationProperties = [];
    dvm.regex = REGEX;
    dvm.prefixes = prefixes;
    dvm.searchText = {};
    dvm.showOverlay = false;
    dvm.showPropertyValueOverlay = false;
    dvm.changed = [];
    dvm.missingProperties = [];
    dvm.eu = exploreUtilsService;
    dvm.instance = {};

    dvm.$onInit = function() {
        dvm.instance = dvm.ds.getInstance();
        getProperties();
        getReificationProperties();
    }
    dvm.newInstanceProperty = function() {
        modalService.openModal('newInstancePropertyOverlay', {properties: dvm.properties, instance: dvm.instance}, dvm.addToChanged);
    }
    dvm.showIriConfirm = function() {
        modalService.openConfirmModal('<p>Changing this IRI might break relationships within the dataset. Are you sure you want to continue?</p>', dvm.showIriOverlay);
    }
    dvm.showIriOverlay = function() {
        var split = $filter('splitIRI')(dvm.instance['@id']);
        modalService.openModal('editIriOverlay', {iriBegin: split.begin, iriThen: split.then, iriEnd: split.end}, dvm.setIRI);
    }
    dvm.getOptions = function(propertyIRI) {
        var range = dvm.eu.getRange(propertyIRI, dvm.properties);
        if (range) {
            return es.getClassInstanceDetails(dvm.ds.explore.recordId, range, {offset: 0, infer: true}, true)
                .then(response => {
                    var options = filter(response.data, item => !some(dvm.instance[propertyIRI], {'@id': item.instanceIRI}));
                    if (dvm.searchText[propertyIRI]) {
                        return filter(options, item => dvm.eu.contains(item.title, dvm.searchText[propertyIRI]) || dvm.eu.contains(item.instanceIRI, dvm.searchText[propertyIRI]));
                    }
                    return options;
                }, errorMessage => {
                    dvm.util.createErrorToast(errorMessage);
                    return [];
                });
        }
        return $q.when([]);
    }
    dvm.addToChanged = function(propertyIRI) {
        dvm.changed = uniq(concat(dvm.changed, [propertyIRI]));
        dvm.missingProperties = dvm.getMissingProperties();
    }
    dvm.isChanged = function(propertyIRI) {
        return includes(dvm.changed, propertyIRI);
    }
    dvm.setIRI = function(iriObj) {
        dvm.instance['@id'] = iriObj.iriBegin + iriObj.iriThen + iriObj.iriEnd;
    }
    dvm.onSelect = function(text, propertyIRI, index) {
        modalService.openModal('propertyValueOverlay', {iri: propertyIRI, index: index, text, properties: dvm.reificationProperties}, dvm.addToChanged, 'lg');
    }
    dvm.getMissingProperties = function() {
        var missing = [];
        forEach(dvm.properties, property => {
            forEach(get(property, 'restrictions', []), restriction => {
                var length = get(dvm.instance, property.propertyIRI, []).length;
                if (restriction.cardinalityType === prefixes.owl + 'cardinality' && length !== restriction.cardinality) {
                    missing.push('Must have exactly ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                } else if (restriction.cardinalityType === prefixes.owl + 'minCardinality' && length < restriction.cardinality) {
                    missing.push('Must have at least ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                } else if (restriction.cardinalityType === prefixes.owl + 'maxCardinality' && length > restriction.cardinality) {
                    missing.push('Must have at most ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                }
            });
        });
        dvm.isValid = !missing.length;
        dvm.changeEvent({value: dvm.isValid});
        return missing;
    }
    dvm.getRestrictionText = function(propertyIRI) {
        var details = find(dvm.properties, {propertyIRI});
        var results = [];
        forEach(get(details, 'restrictions', []), restriction => {
            if (restriction.cardinalityType === prefixes.owl + 'cardinality') {
                results.push('exactly ' + restriction.cardinality);
            } else if (restriction.cardinalityType === prefixes.owl + 'minCardinality') {
                results.push('at least ' + restriction.cardinality);
            } else if (restriction.cardinalityType === prefixes.owl + 'maxCardinality') {
                results.push('at most ' + restriction.cardinality);
            }
        });
        return results.length ? ('[' + join(results, ', ') + ']') : '';
    }
    dvm.cleanUpReification = function($chip, propertyIRI) {
        var object = angular.copy($chip);
        remove(dvm.ds.explore.instance.entity, {
            [prefixes.rdf + 'predicate']: [{'@id': propertyIRI}],
            [prefixes.rdf + 'object']: [object]
        });
    }
    dvm.transformChip = function(item) {
        dvm.ds.explore.instance.objectMap[item.instanceIRI] = item.title;
        return dvm.eu.createIdObj(item.instanceIRI)
    }

    function getProperties() {
        $q.all(map(dvm.instance['@type'], type => es.getClassPropertyDetails(dvm.ds.explore.recordId, type)))
            .then(responses => {
                dvm.properties = concat(dvm.properties, uniq(flatten(responses)));
                dvm.missingProperties = dvm.getMissingProperties();
            }, () => dvm.util.createErrorToast('An error occurred retrieving the instance properties.'));
    }
    function getReificationProperties() {
        es.getClassPropertyDetails(dvm.ds.explore.recordId, prefixes.rdf + 'Statement')
            .then(response => dvm.reificationProperties = response, () => dvm.util.createErrorToast('An error occurred retrieving the reification properties.'));
    }
}

export default instanceFormComponent;
