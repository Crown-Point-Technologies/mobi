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
import * as _ from 'lodash';

/**
 * @ngdoc service
 * @name shared.service:d3TransformerService
 *
 * @description
 * `d3TransformerService` is a service that provides different transformers to convert json-ld
 *  to json objects used by the d3 library.
 */
function d3TransformerService() {
    var self = this;

    /**
     * @ngdoc method
     * @name buildForceDirectedGraphD3Format
     * @methodOf shared.service:d3TransformerService
     *
     * @description
     * Transform provided JSON-LD object to the D3 force directed graph json format
     *
     * @param {Object} A JSON-LD array (typically contains an ontology or dataset records)
     * @return {Object} A formatted JSON object
     */
    self.buildForceDirectedGraphD3Format = function(inputData) {
        var jsonld = JSON.parse(inputData);
        var allNodes: any = {};
        allNodes.nodes = [];
        allNodes.links = [];

        _.forEach(jsonld, (jsonldNode, index) => {
            var jsonldNodeKeys = _.keys(jsonldNode);
            var getValueId = _.get(jsonldNode, '@id');

            buildNode(allNodes, getValueId, 1, "obj");

            var filterAnnotations = _.filter(jsonldNodeKeys, o => !_.startsWith(o, '@'));

            _.forEach(filterAnnotations, (element, key) => {
                var getValue = _.get(jsonldNode, element);
                buildWithLinks(allNodes, getValueId, element, getValue);
            });
        });
        return allNodes;
    }

    /**
     * @ngdoc method
     * @name buildHierarchyD3Format
     * @methodOf shared.service:d3TransformerService
     *
     * @description
     * Transform provided JSON-LD object to the D3 hierarchy json format
     *
     * @param {Object} A JSON-LD array (typically contains an ontology or dataset records)
     * @return {Object} A formatted JSON object
     */
    /* self.buildHierarchyD3Format = function(jsonld) {
        return '';
    } */

    function buildWithLinks(allNodes, parentId, predicate, jsonld) {
        _.forEach(jsonld, (jsonldNode, index) => {
            var jsonldNodeKeys = _.keys(jsonldNode);

            var link: any = {};
            var getValueId = _.get(jsonldNode, '@id');

            if (getValueId) {
                buildNode(allNodes, getValueId, 1, "obj");

                link.source = parentId;
                link.predicate = predicate;
                link.target = getValueId;
                link.edgetype = "obj";
                allNodes.links.push(link);
            }

            _.forEach(jsonldNodeKeys, (element, key) => {
                var singleNode = {};
                var getValue = _.get(jsonldNode, element);
                var innerparentId = _.get(getValue, '@id');

                if (innerparentId) {
                    buildWithLinks(allNodes, innerparentId, element, getValue);
                }
            })
        });
    }

    function buildNode(allNodes, id, group, type) {
        var singleNode: any = {};
        if (id && group) {
            singleNode.id = id;
            singleNode.group = 1;
            singleNode.type = type;
            if (!_.find(allNodes.nodes, singleNode)) {
                allNodes.nodes.push(singleNode);
            }
        }
    }
}

export default d3TransformerService;