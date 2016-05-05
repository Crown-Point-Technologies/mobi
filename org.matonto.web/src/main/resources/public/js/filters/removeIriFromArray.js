(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name removeIriFromArray
         * @requires responseObj
         *
         * @description 
         * The `removeIriFromArray` module only provides the `removeIriFromArray` filter
         * which removes objects with a specific id from an array of objects.
         */
        .module('removeIriFromArray', ['responseObj'])
        /**
         * @ngdoc filter
         * @name removeIriFromArray.filter:removeIriFromArray
         * @kind function
         * @requires responseObj.responseObj
         *
         * @description 
         * Takes an array of objects and removes any elements that have matching ids based on
         * the passed in toRemove. The passed in toRemove could be a string with an id or an array of 
         * objects with the components of an id as keys. If the passed in array is not 
         * actually an array, returns an empty array.
         *
         * @param {Object[]} arr The array of objects to remove elements from
         * @param {string|Object[]} toRemove The id value(s) to match with objects in the array. 
         * Expects either a string or an array of objects with the components of the ids
         * @returns {Object} Either an empty array if the passed in array is not actually an 
         * array or an array of the elements of the passed in array that do not have matching
         * ids based on the passed in toRemove.
         */
        .filter('removeIriFromArray', removeIriFromArray);

    removeIriFromArray.$inject = ['responseObj'];

    function removeIriFromArray(responseObj) {
        function hasId(id, arr) {
            return _.some(arr, function(obj) {
                return id === _.get(obj, '@id');
            });
        }

        return function(arr, toRemove) {
            var result = [];

            if(_.isArray(arr) && arr.length && toRemove) {
                var itemIri,
                    removeIsArray = _.isArray(toRemove),
                    i = 0;

                result = _.filter(arr, function(obj) {
                    itemIri = responseObj.getItemIri(obj);
                    return (removeIsArray && !hasId(itemIri, toRemove)) || (!removeIsArray && toRemove !== itemIri);
                });
            } else if(!toRemove) {
                result = result.concat(arr);
            }

            return result;
        }
    }
})();