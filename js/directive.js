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

app.directive("modalOnDemand",["$rootScope","$window","msgBusService","modalService",function($rootScope,$window,msgBusService,modalService) {
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

app.directive("widCheck",function() {
	return {
		link: function(scope,elemt,attr) {
			elemt.bind("change",function() {
				scope.checkWID(elemt[0].value,attr.widCheck);
			});
		}
	}
});

app.directive("switch",function() {
	var _global = JSON.parse(document.getElementById("dataConfig").textContent);
	var couchMode = _global.databaseConfig.dbMode === "couchDB";
	var remote = _global.databaseConfig.mode === "remote";
	
	return {
		restrict: "E",
		template: 	"<div class='inline-block padding-left-25' ng-show='showSwitch'>" +
						"<div class='small-letters white'>Sync Mode</div>" +
						"<div>" +
							"<label class='switch'>" +
								"<input type='checkbox' ng-model='switchStatus' ng-click='switchChange()' >" +
								"<div class='slider round'></div>" +
							"</label>" +
						"</div>" +
					"</div>",
		link: function(scope,elemt,attr) {
			(couchMode === true) ? scope.showSwitch = true : "";
			(remote === true) ? scope.switchStatus = true : scope.switchStatus = false;
			scope.switchChange = function() {
				
			}
		}
	}
});

app.directive("toolTip",function() {
	return {
		restrict: "E",
		scope: {},
		replace: true,
		template: "<div ng-show='tip'>{{tipText}}</div>",
		link: function(scope,elemt,attr) {
			elemt.on("focus",function() {
				scope.tipText = attr.tip;
				console.log(scope.tipText);
				scope.tip = true;
			});
			elemt.on("blur",function() {
				console.log("HUND");
			});
		}
	}
});

app.directive("clipboard",["$timeout",function($timeout) {
	return {
		restrict: "A",
		scope: {
			cbvalue: "="
		},
		transclude: true,
		template: 	"<div ng-transclude=''></div>" +
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
		link: function(scope,elemt,attr) {
			var urls = ["targeturl","campaignID","FQ","cid"];
			var urlsTranslation = ["Ziel-URL","Kampagnen-Nummer","Vollqualifizierter Link","Kampagnen-ID (CID)"];
			var clip = $(".specialInput")[scope.cbvalue.id];
			
			(function() {
				scope.cbvaluenew = [];
				for(var key in scope.cbvalue.doc) {
					if(!scope.cbvalue.doc.hasOwnProperty(key)) continue;
					for(var i=0;i<=urls.length-1;i++) {
						if(urls[i] === key) scope.cbvaluenew.push({key:urlsTranslation[i],value:scope.cbvalue.doc[key]});
					}
				}
			})();
			
			scope.show = false;
			scope.showme = function() {
				if(!scope.show) {
					var el = document.getElementsByClassName("spid_" + scope.cbvalue.id);
					for(var i=0;i<=el.length-1;i++) {
						el[i].style.width = ((el[i].value.length + 1) * 7) + "px";
					}
					scope.show = true;
					$(".clipboard-clipboardinfo")[scope.cbvalue.id].classList.add("clipboard-popup");
				} 
			};
			
			scope.close = function() {
				$(".clipboard-clipboardinfo")[scope.cbvalue.id].classList.add("clipboard-popout");
				$timeout(function() {
					scope.show = false;
					$(".clipboard-clipboardinfo")[scope.cbvalue.id].classList.remove("clipboard-popout");
				},500);
			}
			
			scope.copytoclipboard = function(val) {
				var inp = document.getElementsByClassName("spid_" + scope.cbvalue.id)[val];
				var info = document.getElementsByClassName("ci_" + scope.cbvalue.id + "_" + val)[0];
				inp.select();
				try {
					document.execCommand("copy");
				}catch(err) {
					console.log("not supported");
				}finally {
					info.classList.add("clipboard-copied-info-show");
					$timeout(function() {
						scope.show = false;
						info.classList.remove("clipboard-copied-info-show");
					},1000);
				}
			}
		}
	}
}]);