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

app.directive("sitetitle",function(routeNavi,$location) {
	return {
		restrict: "E",
		template: "<div class='title'><h1>{{title}}</div></h1></div>",
		replace: true,
		controller: function($scope,$rootScope) {
			for(var i=0; i<=routeNavi.routes.length-1;i++) {
				if(routeNavi.routes[i].path === $location.path()) $scope.title = routeNavi.routes[i].name;
			}
			$rootScope.$on("$location:change", function(event,data) {
				$scope.title = data;
			});
		}
	}
});

app.directive("popdown",function(msgBusService) {
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

app.directive("modalOnDemand",["$rootScope","msgBusService","modalService",function($rootScope,msgBusService,modalService) {
	return {
		restrict: "E",
		scope: {},
		template: 	"<div ng-show='modalShow'>" +
						"<div class='modal-overlay'></div>" +
						"<div class='modal-dialog'>" + 
							"<div class='modal-bar'>&nbsp;</div>" +
							"<div class='modal-icon'><span ></span></div>" +
							"<button ng-click='modalHide()' type='button' class='btn btn-default ng-modal-close' style='padding: 3px 3px;'>" +
								"<span class='glyphicon glyphicon-remove' aria-hidden='true'></span>" +
							"</button>" +
							"<div class='modal-dialog-padding'>" +
								"<div class='modal-dialog-content'>" +
									"<ng-include src='modalTemplate' />" +
								"</div>" + 
							"</div>" +
						"</div>" +
					"</div>",
		link: function(scope,elem,attr) {
			scope.modalShow = null;
			scope.modalHide = function() {
				modalService.reject();
				scope.modalShow = null;
			};
			scope.modalTemplate = "";
			msgBusService.get("modal:init",scope,function(event,data) {
				scope.modalShow = data;
				scope.modalTemplate = "templates/modal/" + data + ".html";
			});
		}
	}
}]);

app.directive('modalDialog', function() {
	return {
		restrict: 'E',
		scope: {},
		replace: true,
		transclude: true,
		link: function(scope, element, attrs,ctrl,transcludeFn) {
			scope.dialogStyle = {};
			if(attrs.width) scope.dialogStyle.width = attrs.width;
			if(attrs.height) scope.dialogStyle.height = attrs.height;
			if(attrs.icon) scope.icon = attrs.icon;
			scope.modalType = attrs.type;
		},
		controller: function($scope,$rootScope,msgBusService) {
			$scope.show = false;
			$scope.hideModal = function() {
				$scope.show = false;
			};
			msgBusService.get("modal:toggle",$scope,function(event,data) {
				if($scope.modalType === "alert") {
					$scope.show = true;
				} else if($scope.modalType === "insert") {
					$scope.show = true;
				}
			});
		},
		template: 	"<div class='ng-modal' ng-show='show'>" +
						"<div class='ng-modal-overlay'></div>" + 
						"<div class='ng-modal-dialog' ng-style='dialogStyle'>" +
							"<div class='ng-modal-icon'><span class='{{icon}}'></span></div>" +
							"<button ng-click='hideModal()' type='button' class='btn btn-default ng-modal-close' style='padding: 3px 3px;'>" +
								"<span class='glyphicon glyphicon-remove' aria-hidden='true'></span>" +
							"</button>" +
							"<div class='ng-modal-dialog-padding'>" +
								"<div class='ng-modal-dialog-content' ng-transclude></div>" +
							"</div>" +
						"</div>" +
					"</div>"
	}
});

app.directive("validateDate",function() {
	return {
	   restrict: 'A',
	   require: 'ngModel',
	   link: function(scope, ele, attrs, ctrl){
			scope.$watch(attrs.ngModel,function(datesObj) {
				if(datesObj !== undefined) {
					if(datesObj["Start"] && datesObj["End"]) {
						var dayEnd = datesObj.End.substring(0,2);
						var monthEnd = datesObj.End.substring(3,5);
						var yearEnd = datesObj.End.substring(6,10);
						var dayStart = datesObj.Start.substring(0,2);
						var monthStart = datesObj.Start.substring(3,5);
						var yearStart = datesObj.Start.substring(6,10);
						if(new Date(monthStart + "/" + dayStart + "/" + yearStart) <= new Date(monthEnd + "/" + dayEnd + "/" + yearEnd)) {
							ctrl.$setValidity("wrongDatePeriod",true);
						} else {
							ctrl.$setValidity("wrongDatePeriod",false);
						}
					}
				}
			},true);
	   }
	}
});