(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name textArea
         * @requires customLabel
         *
         * @description 
         * The `textArea` module only provides the `textArea` directive which creates
         * a textarea element with a customLabel and a custom on change function.
         */
        .module('textArea', ['customLabel'])
        /**
         * @ngdoc directive
         * @name textArea.directive:textArea
         * @scope
         * @restrict E
         *
         * @description 
         * `textArea` is a directive which creates a Bootstrap "form-group" div with
         * a testarea element and a customLabel. The textarea is bound to the passed in 
         * bindModel variable and can have a custom on change function.
         *
         * @param {*} bindModel The variable to bind the value of the textarea to
         * @param {function} changeEvent A function to be called when the value of the
         * textarea changes
         * @param {string=''} displayText The text to be displayed in the customLabel
         * @param {string=''} mutedText The muted text to be displayed in the customLabel
         *
         * @usage
         * <!-- With defaults -->
         * <text-area ng-model="variableName" change-event="console.log('On change')"></text-area>
         *
         * <!-- With all params --> 
         * <text-area ng-model="variableName" change-event="console.log('On change')" display-text="'Label text'" muted-text="'Muted text'"></text-area>
         */
        .directive('textArea', textArea);

        function textArea() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/textArea/textArea.html'
            }
        }
})();