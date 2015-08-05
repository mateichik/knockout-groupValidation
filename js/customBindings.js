(function customBindings() {

	var validationFunctions = [];

	var validateGroup = function(group){

		var groupValidationResult = true;

		for(var i = 0; i < validationFunctions.length; i += 1){

			if(validationFunctions[i].groups.indexOf(group) !== -1){

				var functionValidationResult = validationFunctions[i].validationFunction();

				if(groupValidationResult === true && 
				   functionValidationResult === false){

					groupValidationResult = false;
				}
			}
		}

		return groupValidationResult;
	}


	var validateGroups = function(groups){

		var validationResult = true;

		for(var groupIndex = 0; groupIndex < groups.length; groupIndex += 1){

			var groupValidationResult = validateGroup(groups[groupIndex]);

			if(validationResult === true && 
			   groupValidationResult === false){

				validationResult = false;
			}
		}

		return validationResult;
	}


	ko.bindingHandlers.validate = {

		init: function(element, valueAccessor){

			var $element = $(element);
			var groups = valueAccessor();

			var registeredEvents = $._data($element.get(0), "events");
			var clickHandler = registeredEvents['click'][0].handler;

			$element.off('click');
			$element.on('click', function(e){

				if(validateGroups(groups)){
					clickHandler(e);
				};
			});
		}, 

		update: function(element, valueAccessor){

		}
	};

	

	var isRequiredValid = function(value){

		if(value && value !== ''){
			return true;
		}

		return false;
	}

	var tryCreateValidationMessageForElement = function($element) {

		if($element.next().hasClass('validationCallout')) { return; }

		var $validationCallout = $('<div class="validationCallout" style="display:none">' +
	                                        '<div class="calloutTriangle"></div>' +
	                                        '<div class="validationImage"></div>' +
	                                        '<div class="validationMessage"></div>' +
	                                        '<div class="validationClose">x</div>' +
	                                 '</div>');
	    $element.after($validationCallout);

	    $element.on('focusin', function(){

	    	$('.validationCallout').hide();
	    	tryShowValidationCallout($element);
	    });

        $validationCallout.find('.validationClose').click(function () {
            $validationCallout.hide();
        });
	}



	var tryHideValidationCallout = function($element){

		var elementValidationErrors = $element.data(errorsDataKey) || '';

		if(elementValidationErrors !== ''){ return; }

		if($element.hasClass('validationTarget') === true){

			$element.removeClass('validationTarget');
		}

		var $callout = $element.next();

		if(!$callout.hasClass('validationCallout')){
			console.log('Can not hide validation callout');
			return;
		}

		$callout.hide();
	}


	var tryShowValidationCallout = function($element){
		var elementValidationErrors = $element.data(errorsDataKey) || '';

		if(elementValidationErrors === '') {return;}

		if($element.hasClass('validationTarget') === false){

			$element.addClass('validationTarget');
		}

		var $callout = $element.next();

		if(!$callout.hasClass('validationCallout') === true){
			console.log('Can not show validation callout');
			return;
		}

		
		$callout.find('.validationMessage')
			    .html(elementValidationErrors);

		$('.validationCallout').hide();
		$callout.show();
	}


	var errorsDataKey = 'validation-errors';

	var validationMessageSplitter = '<br/>';
	var addValidationMessageToElement  = function($element, validationMessage){

		var elementValidationErrors = $element.data(errorsDataKey) || '';

		if(elementValidationErrors.indexOf(validationMessage) === -1){
			$element.data(errorsDataKey, elementValidationErrors +  validationMessage + validationMessageSplitter);
		}

		tryShowValidationCallout($element);
	}


	var removeValidationMessageFromElement = function($element, validationMessage){

		var elementValidationErrors = $element.data(errorsDataKey) || '';

		$element.data(errorsDataKey, elementValidationErrors.replace(validationMessage + validationMessageSplitter, ''));

		tryHideValidationCallout($element);
	}


	var orGroups = [];

	var getOrGroupByName = function(orGroupName) {

		for(var i=0; i < orGroups.length; i+=1){

			if(orGroups[i].name === orGroupName){
				return orGroups[i];
			}
		}

		return null;
	}

	var isOrGroupValid = function(orGroup){

		var valueBindings = orGroup.valueBindings;

		for(var i=0; i< valueBindings.length; i+=1){

			if(valueBindings[i]() && valueBindings[i]() !== '' ){
				return true;
			}
		}

		return false;
	}

	ko.bindingHandlers.orRequiredValidation = {

		init: function(element, valueAccessor, allBindings){

			var validationGroups = valueAccessor().groups || [];
			var orGroupName = valueAccessor().orGroup || [];
			var message = valueAccessor().message || 'At least one field should be filled';
			var valueBinding = allBindings.get('value');

			var $element = $(element);

			tryCreateValidationMessageForElement($element);

			var existingOrGroup = getOrGroupByName(orGroupName);

			var elementValidationFunction = function(){

				var orGroupToValidate = getOrGroupByName(orGroupName);

				if( isOrGroupValid(orGroupToValidate) ){

					for(var i=0; i < orGroupToValidate.elements.length; i+=1){
						removeValidationMessageFromElement(orGroupToValidate.elements[i], message);
					}
					
					return true;
				}else{
					
					for(var i=0; i < orGroupToValidate.elements.length; i+=1){
						addValidationMessageToElement(orGroupToValidate.elements[i], message);
					}

					return false;
				}
			};

			
			if(existingOrGroup === null){

				orGroups.push({
					name: orGroupName,
					elements: [$element],
					valueBindings: [ valueBinding ]
				});
			}else{
				existingOrGroup.valueBindings.push(valueBinding);
				existingOrGroup.elements.push($element);
			}

			validationFunctions.push({
				groups: validationGroups,
				validationFunction: elementValidationFunction
			});

			valueBinding.subscribe(elementValidationFunction);
		}, 

		update: function(element, valueAccessor){
		}
	};

	ko.bindingHandlers.requiredValidation = {

		init: function(element, valueAccessor, allBindings){

			var validationGroups = valueAccessor().groups || [];
			var message = valueAccessor().message || 'This field is required';
			var valueBinding = allBindings.get('value');

			var $element = $(element);

			tryCreateValidationMessageForElement($element);

			var elementValidationFunction = function(){

				if( isRequiredValid(valueBinding()) ){

					removeValidationMessageFromElement($element, message);
					return true;
				}else{
					addValidationMessageToElement($element, message);
					return false;
				}
			};

			validationFunctions.push({
				groups: validationGroups,
				validationFunction: elementValidationFunction
			});

			valueBinding.subscribe(elementValidationFunction);
		}, 

		update: function(element, valueAccessor){
			
		}
	}


	var isRegexValid = function(regexString, value) {

		var regex = new RegExp(regexString, 'g');

		return value.match(regex);
	}	


	ko.bindingHandlers.regexValidation = {

		init: function(element, valueAccessor, allBindings){

			var validationGroups = valueAccessor().groups || [];
			var regexString = valueAccessor().regex;
			var message = valueAccessor().message || 'This field has wrong format';
			var valueBinding = allBindings.get('value');

			var $element = $(element);

			tryCreateValidationMessageForElement($element);

			var elementValidationFunction = function(){

				if( isRegexValid(regexString, valueBinding()) ){

					removeValidationMessageFromElement($element, message);
					return true;
				}else{
					addValidationMessageToElement($element, message);
					return false;
				}
			};

			validationFunctions.push({
				groups: validationGroups,
				validationFunction: elementValidationFunction
			});

			valueBinding.subscribe(elementValidationFunction);
		}, 

		update: function(element, valueAccessor){
			
		}
	};

	



})();