app.directive("navi",["routeNavi",function(routeNavi) {
	return {
		restrict: "E",
		replace: true,
		templateUrl: "templates/navi_template.html",
		controller: function($scope) {
			$scope.routes = routeNavi.routes;
		}
	}
}]);

app.directive("datepicker",function() {
	return {
		restrict: "A",
		link: function(scope,elem,attr) {
			$(elem).datepicker({
				dateFormat: "dd.mm.yy",
				dayNamesMin: ["So","Mo","Di","Mi","Do","Fr","Sa"],
				monthNames: [ "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember" ],
				autoSize: true
			});
		}
	}
});