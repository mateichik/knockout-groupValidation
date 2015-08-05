function SomeViewModel() 
{
	var self = this;

	self.word = ko.observable('');
	self.number = ko.observable('');

	self.orField1 = ko.observable('');
	self.orField2 = ko.observable('');

	self.fooClicked = function(){
		alert('Foo clicked! ' + self.word() + ' ' + self.number());
	}

	self.barClicked = function(){
		alert('Bar clicked' + self.word() + ' ' + self.number())
	}
}

ko.applyBindings(new SomeViewModel());