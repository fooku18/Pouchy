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

app.directive("quicksend",function() {
	return {
		restrict: "A",
		scope: {hit: "&"},
		link: function(scope,elem,attr) {
			elem.on("keyup",function(e) {
				if(e.keyCode === 13) scope.hit();
			});
		}
	}
});

app.directive("sitetitle",function() {
	return {
		restrict: "E",
		transclude: true,
		template: "<div class='title'><h1><div ng-transclude></div></h1></div>",
		replace: true,
		controller: function($scope,$rootScope) {
			$scope.title = "Kampagnen";
			$rootScope.$on("$location:change", function(event,data) {
				$scope.title = data;
			});
		}
	}
});

app.directive("popdown",function() {
	return {
		restrict: "A",
		scope: {
			options: "=",
			initial: "="
		},
		controller: function($scope) {
			$scope.selected = $scope.initial;
			$scope.stat = false;
			$scope.switcher = function() {
				$scope.stat = !$scope.stat;
			}
			$scope.selectIt = function(val) {
				$scope.selected = val;
			}
		},
		template: 	"<div class='popdown' ng-click='switcher()'>{{selected}}" +
						"<div class='arrow'><span class='glyphicon glyphicon-chevron-down' aria-hidden='true'></span></div>" +
						"<div ng-show='stat' class='poplist'>" + 
							"<div class='popitem' ng-repeat='i in options' ng-click='selectIt(i)'>" +
								"<span>{{i}}</span>" + 
							"</div>" +
						"</div>" +
					"</div>"
	}
});

app.directive("instanceController",function() {
	return {
		restrict: "E",
		scope: true,
		transclude: true,
		controller: function($scope) {
			$scope.getdbName();
			$scope.startListening();
			$scope.fetchInitial();
		},
		template: "<div ng-transclude></div>"
	}
});

app.directive('modalDialog', function() {
	return {
		restrict: 'E',
		scope: {},
		replace: true,
		transclude: true,
		link: function(scope, element, attrs,ctrl,transcludeFn) {
			scope.dialogStyle = {};
			if (attrs.width) scope.dialogStyle.width = attrs.width;
			if (attrs.height) scope.dialogStyle.height = attrs.height;
			scope.test = function() {alert("Hund");};
		},
		controller: function($scope,$rootScope,msgBusService) {
			$scope.show = false;
			$scope.hideModal = function() {
				$scope.show = false;
			};
			$scope.istrue = function(val) {
				if(val === 'Extern') {
					return true;
				} else {
					return false;
				}
			};
			msgBusService.get("modal:toggle",$scope,function(event,data) {
				$scope.show = true;
				$scope.doc = data;
			});
		},
		template: 	"<div class='ng-modal' ng-show='show'>" +
						"<div class='ng-modal-overlay' ng-click='test()'></div>" + 
						"<div class='ng-modal-dialog' ng-style='dialogStyle'>" +
							"<div class='ng-modal-close' ng-click='hideModal()'>X</div>" +
							"<div class='ng-modal-icon'><span class='glyphicon glyphicon-plus'></span></div>" +
							"<div class='ng-modal-dialog-padding'>" +
								"<div class='ng-modal-dialog-content' ng-transclude></div>" +
							"</div>" +
						"</div>" +
					"</div>"
	}
});
