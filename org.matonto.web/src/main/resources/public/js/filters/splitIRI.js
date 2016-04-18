(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name splitIRI
         *
         * @description
         * The `splitIRI` module only provides the `splitIri` directive which splits
         * an IRI string based on the last valid delimiter it finds.
         */
        .module('splitIRI', [])
        /**
         * @ngdoc filter
         * @name splitIRI.filter:splitIRI
         * @kind function
         * 
         * @description
         * Splits an IRI string based on the last valid delimiter (#, /, or :) it finds
         * and returns the beginning, delimiter, and ending in a JSON object. The JSON 
         * object looks like this: 
         * ```
         * {
         *     begin: 'http://matonto.org/ontologies',
         *     then: '/',
         *     end: 'uhtc'
         * }
         * ```
         * If the IRI string is falsey, the JSON object will have empty string values.
         *
         * @param {string} iri The IRI string to split
         *
         * @returns {object} An object with keys for the beginning, delimiter, and end
         * of the IRI string.
         */
        .filter('splitIRI', splitIRI);

    function splitIRI() {
        return function(iri) {
            if(iri) {
                var index,
                    hash = iri.indexOf('#'),
                    slash = iri.lastIndexOf('/'),
                    colon = iri.lastIndexOf(':');

                if(hash !== -1) {
                    index = hash;
                } else if(slash !== -1) {
                    index = slash;
                } else {
                    index = colon;
                }

                return {
                    begin: iri.substring(0, index),
                    then: iri[index],
                    end: iri.substring(index + 1)
                }
            } else {
                return {
                    begin: '',
                    then: '',
                    end: ''
                };
            }
        }
    }
})();