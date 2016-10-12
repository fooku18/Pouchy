//
//###Navigation Module###START
//
angular.module("pouchy.navigation",[])
.factory("routeNavi",["$route","$location",function($route,$location) {
	var routes = [];
	angular.forEach($route.routes, function(val,key) {
		if(val.name) {
			routes.push({
				path: key,
				name: val.name
			})
		}
	});
	return {
		routes: routes
	}
}])
.controller("naviCtrl",["$scope","$location","$rootScope",function($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}])
.directive("navi",["routeNavi",function(routeNavi) {
	return {
		restrict: "E",
		replace: true,
		templateUrl: "templates/navi_template.html",
		controller: function($scope) {
			$scope.routes = routeNavi.routes;
		}
	}
}])
.directive("sitetitle",function(routeNavi,$location) {
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
//
//###Navigation Module###END
//

//
//###Modal Module###START
//
angular.module("pouchy.modal",[])
.service("modalService",["$rootScope","$q","msgBusService",function($rootScope,$q,msgBusService) {
	var modal = {
		defer: null
	}
	
	function open(options) {
		modal.defer = $q.defer();
		msgBusService.emit("modal:init",options);
		return modal.defer.promise;
	}
	
	function reject(data) {
		var tunnel = data || "";
		modal.defer.reject(tunnel);
	}
	
	function resolve(data) {
		var tunnel = data || "";
		modal.defer.resolve(tunnel);
	}
	
	return {
		open: open,
		resolve: resolve,
		reject: reject
	}
}])
.directive("modalOnDemand",["$rootScope","$window","msgBusService","modalService",function($rootScope,$window,msgBusService,modalService) {
	return {
		restrict: "E",
		scope: {},
		template: 	"<div ng-show='modalShow'>" +
						"<div class='custom-modal-overlay'></div>" +
						"<div class='custom-modal-dialog'>" + 
							"<div class='custom-modal-bar {{barColor}}'>&nbsp;</div>" +
							"<div class='custom-modal-icon'><span ></span></div>" +
							"<button ng-click='modalHide()' type='button' class='btn btn-default custom-modal-close' style='padding: 3px 3px;'>" +
								"<span class='glyphicon glyphicon-remove' aria-hidden='true'></span>" +
							"</button>" +
							"<div class='custom-modal-dialog-padding'>" +
								"<div class='custom-modal-dialog-content'>" +
									"<ng-include src='modalTemplate' />" +
								"</div>" + 
							"</div>" +
						"</div>" +
					"</div>",
		link: function(scope,elem,attr) {
			scope.barColor = "custom-modal-bar-green";
			scope.modalShow = null;
			scope.modalHide = function() {
				modalService.reject();
				scope.modalShow = null;
			};
			scope.confirm = function() {
				modalService.resolve();
				scope.modalShow = null;
			};
			scope.modalTemplate = "";
			msgBusService.get("modal:init",scope,function(event,options) {
				scope.values = {};
				scope.barColor = "custom-modal-bar-" + options.barColor;
				if(options.data) scope.values = options.data;
				if(options.template === scope.modalTemplateOld) {
					scope.modalShow = true;
					if(document.getElementById("btn-focus-on")) {
						$window.setTimeout(function() {
							document.getElementById("btn-focus-on").focus();
						},0);
					}
				} else {
					scope.modalTemplate = "templates/modal/" + options.template + ".html";
				}
				scope.modalTemplateOld = options.template;
			});
			scope.$on('$includeContentLoaded', function () {
				scope.modalShow = true;
				if(document.getElementById("btn-focus-on")) {
					$window.setTimeout(function() {
						document.getElementById("btn-focus-on").focus();
					},0);
				}
			});
		}
	}
}]);
//
//###Modal Module###START
//

//
//###Clipboard Module###START
//
angular.module("pouchy.clipboard",[])
.controller("clipboardController",["$scope","$timeout",function($scope,$timeout) {
	var urls = ["targeturl","campaignID","FQ","cid"];
	var urlsTranslation = ["Ziel-URL","Kampagnen-Nummer","Vollqualifizierter Link","Kampagnen-ID (CID)"];
	var clip = $(".specialInput")[$scope.cbvalue.id];
	
	(function() {
		$scope.cbvaluenew = [];
		for(var key in $scope.cbvalue.doc) {
			if(!$scope.cbvalue.doc.hasOwnProperty(key)) continue;
			for(var i=0;i<=urls.length-1;i++) {
				if(urls[i] === key) $scope.cbvaluenew.push({key:urlsTranslation[i],value:$scope.cbvalue.doc[key]});
			}
		}
	})();
	
	$scope.show = false;
	$scope.showme = function() {
		if(!$scope.show) {
			var el = document.getElementsByClassName("spid_" + $scope.cbvalue.id);
			for(var i=0;i<=el.length-1;i++) {
				el[i].style.width = ((el[i].value.length + 1) * 7) + "px";
			}
			$scope.show = true;
			$(".clipboard-clipboardinfo")[$scope.cbvalue.id].classList.add("clipboard-popup");
		} 
	};
	
	$scope.close = function() {
		$(".clipboard-clipboardinfo")[$scope.cbvalue.id].classList.add("clipboard-popout");
		$timeout(function() {
			$scope.show = false;
			$(".clipboard-clipboardinfo")[$scope.cbvalue.id].classList.remove("clipboard-popout");
		},500);
	}
	
	$scope.copytoclipboard = function(val) {
		var inp = document.getElementsByClassName("spid_" + $scope.cbvalue.id)[val];
		var info = document.getElementsByClassName("ci_" + $scope.cbvalue.id + "_" + val)[0];
		inp.select();
		try {
			document.execCommand("copy");
		}catch(err) {
			console.log("not supported");
		}finally {
			info.classList.add("clipboard-copied-info-show");
			$timeout(function() {
				$scope.show = false;
				info.classList.remove("clipboard-copied-info-show");
			},1000);
		}
	}
}])
.directive("clipboard",function() {
	return {
		restrict: "A",
		scope: {
			cbvalue: "="
		},
		transclude: true,
		template: "<div ng-transclude=''></div>" +
					"<div class='clipboard-overlay' ng-click='showme()'>" +
						"<div class='absolute clipboard-clipboardinfo' ng-show='show'>" + 
							"<span class='clipboard-close glyphicon glyphicon-remove' ng-click='close()'></span>" +
							"<div class='clipboard-clipboardframe'>" + 
								"<div class='clipboard-url-block' ng-repeat='i in cbvaluenew track by $index'>" +
									"<div class='clipboard-block-title'>" + 
										"{{i.key}}" +
									"</div>" +
									"<div class='clipboard-block-url'>" +
										"<div class='clipboard-full-width relative'>" +
											"<input class='clipboard-specialInput spid_{{cbvalue.id}}' ng-value='i.value' ng-click='copytoclipboard($index)'></span>" +
											"<span class='absolute clipboard-copied-info ci_{{cbvalue.id}}_{{$index}}'>kopiert</span>" +
										"</div>" +
									"</div>" +
							"</div>" +
						"</div>" +
					"</div>",
		controller: "clipboardController"
	}
});
//
//###Clipboard Module###END
//

//
//###Pagination Module###START
//
angular.module("pouchy.pagination",[])
.controller("paginationDelegate",["$scope",function($scope) {
	$scope.currentPage = 1;
	this.setCurrentPage = function(val) {
		$scope.currentPage = val;
	}
}])
.controller("paginationController",["$scope","$filter","paginationConfig",function($scope,$filter,paginationConfig) {
	function calculate() {
		var base = $filter("included")($scope.items,$scope.searchKey) / $scope.showRows;
		if(base <= 1) {
			$scope.paginationSpan = 1;
		} else {
			var mod = (($filter("included")($scope.items,$scope.searchKey)) % $scope.showRows > 0) ? 1 : 0;
			$scope.paginationSpan = base + mod;
		}
		$scope.paginationSpan = ($scope.paginationSpan > paginationConfig.maxSpan) ? 5 : $scope.paginationSpan;
		$scope.paginationArray = [];
		for(var i=1;i<=$scope.paginationSpan;i++) {
			$scope.paginationArray.push(i);
		}
	}
	$scope.$watch("items + showRows",function() {
		calculate();
	});
	$scope.$watch("searchKey",function() {
		calculate();
	});
	$scope.changePageFn = function(val) {
		if(typeof(val) === "string") {
			($scope.currentPage + parseInt(val,10)) === 0 ? $scope.currentPage = 1 : ($scope.currentPage + parseInt(val,10)) < $scope.paginationSpan ? $scope.currentPage += parseInt(val,10) : $scope.currentPage = $scope.paginationSpan;			
		} else {
			$scope.currentPage = val
		}
		if($scope.currentPage > $scope.paginationArray[$scope.paginationArray.length-1]) {
			$scope.paginationArray = $scope.paginationArray.slice(1);
			$scope.paginationArray.push($scope.currentPage);
		}
		if($scope.currentPage < $scope.paginationArray[0]) {
			$scope.paginationArray.pop(1);
			$scope.paginationArray.unshift($scope.currentPage);
		}
		return $scope.currentPage;
	}
	$scope.currentPage = 1;
}])
.constant("paginationConfig", 
	{
		maxSpan: 5
	}
)
.directive("paginationShowFilter",function() {
	var tmp = "<select ng-model='showFilter' class='form-control inputField' ng-options='i.name for i in filterItems'></select>";
	return {
		restrict: "E",
		scope: false,
		template: tmp,
		controller: function($scope) {
			$scope.filterItems = [{id:'targeturl',name:'Ziel-URL'},{id:'ad',name:'Werbemittel'},{id:'intext',name:'Typ'},{id:'cid',name:'CID'}];
			$scope.showFilter = $scope.filterItems[0];
		}
	}
})
.directive("paginationShowRows",function() {
	var tmp = "<select ng-model='showRows' class='form-control inputField' ng-options='i for i in filterRows'></select>";
	return {
		restrict: "E",
		scope: false,
		template: tmp,
		controller: function($scope) {
			$scope.filterRows = [10,20,30,40,50];
			$scope.showRows = 10;
		}
	}
})
.directive("paginationParent",function() {
	return {
		restrict: "E",
		transclude: true,
		scope: false,
		controller: "paginationDelegate",
		link: function(scope,element,attr,ctrl,transclude) {
			transclude(scope,function(clone) {
				element.append(clone);
			});
		}
	}
})
.directive("pagination",function() {
	return {
		restrict: "E",
		require: "^paginationParent",
		scope: {
			items: "=",
			showRows: "@",
			searchKey: "@",
			searchFilter: "@"
		},
		controller: "paginationController",
		templateUrl: "templates/pagination/pagination.html",
		link: function(scope,elemt,attr,ctrl,transcludeFn) {
			scope.changePage = function(val) {
				var current = scope.changePageFn(val);
				ctrl.setCurrentPage(current);
			}
		}
	}
})
.filter("pages",function() {
	return function(input,searchKey,currentPage,showRows,showFilter) {
		var regex = new RegExp(searchKey,"i");
		if(angular.isArray(input)) {
			var fitArray = [];
			for(var i=0;i<=input.length-1;i++) {
				if(regex.test(input[i].doc[showFilter])) {
					fitArray.push(input[i]);
				}
			}
			var start = (currentPage-1)*showRows;
			var end = currentPage*showRows;
			return fitArray.slice(start,end);
		}
	}
}).
filter("included",function() {
	return function(input,searchKey,showFilter) {
		var regex = new RegExp(searchKey,"i");
		if(angular.isArray(input)) {
			var fitArray = [];
			for(var i=0;i<=input.length-1;i++) {
				if(regex.test(input[i].doc[showFilter])) {
					fitArray.push(input[i]);
				}
			}
			return fitArray.length;
		} else {
			return input.length;
		}
	}
});
//
//###Pagination Module###END
//

