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


