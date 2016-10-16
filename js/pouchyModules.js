//
//###MultiPurpose Module###START
//
angular.module("pouchy.multiPurpose",[])
.constant("DATALAYER",(function() {
	return JSON.parse(document.getElementById("dataConfig").textContent);
})())
.factory("$msgBusService",["$rootScope",function($rootScope) {
	var msgBus = {};
	msgBus.emit = function(msg,data) {
		$rootScope.$emit(msg,data);
	};
	msgBus.get = function(msg,scope,func) {
		var unbind = $rootScope.$on(msg,func);
		scope.$on("$destroy",unbind);
	};
	return msgBus;
}])
.factory("$hashService",function() {
	var hash = function(str, asString, seed) {
		var i, l,
			hval = (seed === undefined) ? 0x811c9dc5 : seed;

		for (i = 0, l = str.length; i < l; i++) {
			hval ^= str.charCodeAt(i);
			hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
		}
		if( asString ){
			// Convert to 8 digit hex string
			return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
		}
		return hval >>> 0;
	};
	
	return {
		hash: hash
	};
});
//
//###MultiPurpose Module###END
//

//
//###Navigation Module###START
//
angular.module("pouchy.navigation",[])
.factory("routeNavi",["$route","$location",function routeNaviFactory($route,$location) {
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
.controller("naviCtrl",["$scope","$location","$rootScope",function naviController($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}])
.directive("navi",["routeNavi",function naviDirective(routeNavi) {
	return {
		restrict: "E",
		replace: true,
		templateUrl: "templates/navi_template.html",
		controller: function($scope) {
			$scope.routes = routeNavi.routes;
		}
	}
}])
.directive("sitetitle",["routeNavi","$location","$pouchDB",function sitetitleDirective(routeNavi,$location,$pouchDB) {
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
}]);
//
//###Navigation Module###END
//

//
//###Modal Module###START
//
angular.module("pouchy.modal",[])
.run(["$templateRequest",function($templateRequest) {
	$templateRequest("templates/modal/create.html");
	$templateRequest("templates/modal/delete.html");
	$templateRequest("templates/modal/fileExtensionError.html");
	$templateRequest("templates/modal/invalid.html");
	$templateRequest("templates/modal/success.html");
	$templateRequest("templates/modal/connectionError.html");
}])
.service("$modalService",["$rootScope","$q","$msgBusService",function modalService($rootScope,$q,$msgBusService) {
	var modal = {
		defer: null
	}
	
	function open(options) {
		modal.defer = $q.defer();
		$msgBusService.emit("modal:init",options);
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
.directive("modalOnDemand",["$rootScope","$window","$msgBusService","$modalService",function modalOnDemandDirective($rootScope,$window,$msgBusService,$modalService) {
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
			//scope.barColor = "custom-modal-bar-green";
			scope.modalShow = null;
			scope.modalHide = function() {
				$modalService.reject();
				scope.modalShow = null;
			};
			scope.confirm = function() {
				$modalService.resolve();
				scope.modalShow = null;
			};
			scope.modalTemplate = "";
			$msgBusService.get("modal:init",scope,function(event,options) {
				scope.values = {};
				scope.barColor = "custom-modal-bar-" + options.barColor;
				scope.modalTemplate = "templates/modal/" + options.template + ".html";
				scope.remote = options.remote;
				if(options.data) scope.values = options.data;
				scope.modalShow = true;
				if(document.getElementById("btn-focus-on")) {
					$window.setTimeout(function() {
						document.getElementById("btn-focus-on").focus();
					},0);
				}
			});
			/*scope.$on('$includeContentLoaded', function () {
				scope.modalShow = true;
				if(document.getElementById("btn-focus-on")) {
					$window.setTimeout(function() {
						document.getElementById("btn-focus-on").focus();
					},0);
				}
			});*/
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
.controller("clipboardController",["$scope","$timeout",function clipboardController($scope,$timeout) {
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
.directive("clipboard",function clipboardDirective() {
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
.controller("paginationDelegate",["$scope",function paginationDelegateController($scope) {
	$scope.currentPage = 1;
	this.setCurrentPage = function(val) {
		$scope.currentPage = val;
	}
}])
.controller("paginationController",["$scope","$filter","paginationConfig",function paginationController($scope,$filter,paginationConfig) {
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
.directive("paginationShowFilter",function paginationShowFilterDirective() {
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
.directive("paginationShowRows",function paginationShowRowsDirective() {
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
.directive("paginationParent",function paginationParentDirective() {
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
.directive("pagination",function paginationDirective() {
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
.filter("pages",function pagesFilter() {
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
filter("included",function includedFilter() {
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

//
//###Import/Export Module###START
//
angular.module("pouchy.import_export",["pouchy.multiPurpose","pouchy.FileReader"])
.factory("exportFactory",function exportFactory() {
	var saveData = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, fileName) {
			var json = JSON.stringify(data),
			//	blob = new Blob([json], {type: "octet/stream"}),
			//	url = window.URL.createObjectURL(blob);
			url = "data:application/json,";
			a.href = url + json;
			a.download = fileName;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}());
	
	function exportFile(data,fileName) {
		saveData(data, fileName);
	}
	
	return {
		exportFile: exportFile
	}
})
.controller("downloadCtrl",["$scope","exportFactory","$pouchDB","DATALAYER","$q",function downloadCtrl($scope,exportFactory,$pouchDB,DATALAYER,$q) {
	$scope.downloadBoxActive = false;
	$scope.export = false;
	$scope.import = false;
	this.toggleWindow = function() {
		$scope.downloadBoxActive = !$scope.downloadBoxActive;
	};
	this.toggleText = function(val) {
		$scope.export = false;
		$scope.import = false;
		$scope[val] = !$scope[val];
	};
	$scope.progressBarStatus = 0;
	this.updateProgressBar = function(val) {
		if(val < 100) {
			$scope.progressBarStatus = val;
		} else {
			$scope.progressBarStatus = 0;
		}
	}
	$scope.exportFile = function(val) {
		var chain = [];
		//for(var i=0;i<=DATALAYER.databaseConfig.databases.length-1;i++) {
		//	chain.push(DATALAYER.databaseConfig.databases[i]);
		//}
		//$pouchDB.fetchAllDocs("cid_db");
	}
}])
.directive("downloadPop",function downloadPopDirective() {
	var tmp = 	"<div class='border-wrapper absolute' ng-show='downloadBoxActive'>" +
					"<div class='padding-left-relative-80'>" +
						"<div class='download-arrow'></div>" +
					"</div>" +
					"<div class='download-container'>" +
						"<div ng-show='export'>" +
							"<h4 class='download-headline'>Import</h4>" +
							"<div class='download-frame'>" +
								"<div class='download-content'>" +
									"<label for='upload-input' class='full btn btn-default'>Upload</label>" +
									"<div class='download-loading-wrapper'>" +
										"<div class='download-loading-bar'>" + 
											"<div class='download-loading-process' ng-style='{width: progressBarStatus + \"px\"}'>" +
											"</div>" +
										"</div>" +
									"</div>" +
									"<input type='file' name='upload-input' id='upload-input' class='display-none' file-reader />" +
								"</div>" +
							"</div>" +
						"</div>" +
						"<div ng-show='import'>" +
							"<h4 class='download-headline'>Export</h4>" +
							"<div class='download-frame'>" +
								"<div class='download-content'>" +
									"<div class='padding-10 cursor-pointer download-top' ng-click='exportFile(\"json\")'>" +
										"<b>.JSON</b> &nbsp; <span class='glyphicon glyphicon-floppy-save glyphicon-20 pull-right'></span>" +
									"</div>" +
									"<div class='padding-10 cursor-pointer' ng-click='exportFile(\"csv\")'>" +
										"<b>.CSV</b> &nbsp; <span class='glyphicon glyphicon-floppy-save glyphicon-20 pull-right'></span>" +
									"</div>" +
								"</div>" +
							"</div>" +
						"</div>" +
					"</div>" +
				"</div>";
	return {
		restrict: "A",
		scope: {},
		controller: "downloadCtrl",
		template: tmp,
		transclude: true,
		link: function(scope,element,attr,ctrl,transcludeFn) {
			transcludeFn(scope,function(clone) {
				element.append(clone);
			});
		}
	}
})
.directive("importExport",function importExportDirective() {
	return {
		restrict: "A",
		require: "^downloadPop",
		scope: true,
		link: function(scope,element,attr,ctrl) {
			element.on("click",function() {
				scope.$apply(function() {
					ctrl.toggleWindow();
					if(attr["importExport"] === "export") {
						ctrl.toggleText("export");
					} else {
						ctrl.toggleText("import");
					}
				})
			});
		}
	}
});
//
//###Import/Export Module###END
//

//
//###FileReader Module###START
//
angular.module("pouchy.FileReader",["pouchy.import_export"])
.directive("fileReader",["$modalService",function($modalService) {
	return {
		restrict: "A",
		scope: {},
		require: "^downloadPop",
		link: function(scope,element,attr,ctrl) {
			element.on("change",function(changeEvent) {
				var file = changeEvent.target.files[0];
				var fileType = /^application\/json$/;
				if(file.type.match(fileType)) {
					var reader = new FileReader();
					reader.onload = function (loadEvent) {
						scope.$apply(function () {
							scope.ngFileModel = {
								lastModified: changeEvent.target.files[0].lastModified,
								lastModifiedDate: changeEvent.target.files[0].lastModifiedDate,
								name: changeEvent.target.files[0].name,
								size: changeEvent.target.files[0].size,
								type: changeEvent.target.files[0].type,
								data: loadEvent.target.result
							};
							ctrl.updateProgressBar(100);
						});
					}
					reader.onprogress = function(event) {
						if(event.lengthComputable) {
							ctrl.updateProgressBar(100 * (event.loaded / event.total));
						}
					}
					reader.readAsText(changeEvent.target.files[0]);
				} else {
					console.log("File Extension Error");
					$modalService.open({template:"fileExtensionError",barColor:"red"}).
					then(function() {
						console.log("resolved");
					},function() {
						console.log("rejected");
					});
				}
			});
		}
	}
}]);
//
//###FileReader Module###END
//

//
//###PouchDB Module###START
//
angular.module("pouchy.pouchDB",[])
.service("$pouchDB",["$rootScope","$q","$msgBusService","DATALAYER",function($rootScope,$q,$msgBusService,DATALAYER) {
	var database = {};
	var changeHandler;
	var syncClosure;
	var remote = DATALAYER.databaseConfig.remoteUrl || "";
	var remoteOff;
	
	this.getDatabases = function(dbName) {
		return database[dbName];
	}
	
	this.setDatabase = function(databaseName) {
		database[databaseName] = new PouchDB(databaseName);
	}
	
	this.addItem = function(db,doc) {
		var defer = $q.defer();
		database[db].put(doc).then(function() {
			defer.resolve(doc);
		},function() {
			defer.reject(doc);
		});
		return defer.promise;
	}
	
	this.startListening = function(val) {
		if(changeHandler) changeHandler.cancel();
		changeHandler = database[val].changes(
		{
			since: "now",
			live: true
		}
		).on("change", function(change) {
			if(!change.deleted) {
				$msgBusService.emit(val + ":change",change);
			} else {
				$msgBusService.emit(val + ":delete",change);
			}
		}).on("error", function(err) {
			console.log("Listener failure: " + err);
		});
		if(DATALAYER.databaseConfig.autoSync && !remoteOff) {
			this.startSyncing(val,remote)
		}
	}
	
	this.startSyncing = function(db,remoteDatabase) {
		if(database[db]._events.destroyed.length > 4) {
			database[db]._events.destroyed = database[db]._events.destroyed.slice(0,4);
		}
		remoteOff = false;
		if(syncClosure) syncClosure.cancel();
        syncClosure = database[db].sync(remoteDatabase + db,
			{
				live: true,
				retry: false
			}
		).on("change",function(change) {
			console.log(change);
		}).on('active', function () {
			console.log("active");
		}).on('denied', function (err) {
			console.log(err);
		}).on('complete', function (info) {
			console.log(info);
		}).on('error', function (err) {
			console.log("connection error");
			remoteOff = true;
			$msgBusService.emit("remoteconnection:lost");
		});
    }
	
	this.stopSyncing = function() {
		var defer = $q.defer();
		if(syncClosure) {
			syncClosure.cancel();
		}
		remoteOff = true;
		defer.resolve();
		return defer.promise;
	}
	
	this.fetchAllDocs = function(db) {
		var defer = $q.defer();
		database[db].allDocs({include_docs: true, descending: true}).then(function(docs) {
			defer.resolve(docs);
		},function() {
			defer.reject();
		});
		return defer.promise;
	}
	
	this.deleteDoc = function(db,id,rev) {
		return database[db].remove(id,rev);
	}
}])
.controller("switchCtrl",["$scope","$pouchDB","$currentDB","DATALAYER","$msgBusService","$modalService", function switchController($scope,$pouchDB,$currentDB,DATALAYER,$msgBusService,$modalService) {
	$scope.switchChange = function() {
		if($scope.switchStatus) {
			$pouchDB.startSyncing($currentDB.getDB(),DATALAYER.databaseConfig.remoteUrl);
		} else {
			$pouchDB.stopSyncing().then(function() {
				$modalService.open({template:"connectionError",barColor:"red",remote:DATALAYER.databaseConfig.remoteUrl}).
				then(function() {
					console.log("resolved");
				},function() {
					console.log("rejected");
				});
			});
		}
	}
	$msgBusService.get("remoteconnection:lost",$scope,function() {
		$scope.$apply(function() {
			$scope.switchStatus = false;
			//switch message lamp ########################### to add
		})
	});
}])
.directive("switch",["DATALAYER",function switchDirective(DATALAYER) {
	var _global = DATALAYER;
	var couchMode = _global.databaseConfig.dbMode === "couchDB";
	var remote = _global.databaseConfig.autoSync === true;
	
	return {
		restrict: "E",
		scope: {},
		replace: true,
		controller: "switchCtrl",
		template: 	"<div class='inline-block'>" +
						"<div class='inline-block padding-left-25' ng-show='showSwitch'>" +
							"<div class='small-letters white'>Sync Mode</div>" +
							"<div>" +
								"<label class='switch'>" +
									"<input id='switcher' type='checkbox' ng-model='switchStatus' ng-click='switchChange()' >" +
									"<div class='slider round'></div>" +
								"</label>" +
							"</div>" +
						"</div>" + 
						//"<div class='inline-block switch-remote-message'>" +
						//	"<div class='small-letters white'></div>" +
						//	"<div class='switch-remote-message-content'>" +
						//		"CONTENT" +
						//	"</div>" + 
						//"</div>" +
					"</div>",
		link: function(scope,elemt,attr) {
			(couchMode === true) ? scope.showSwitch = true : "";
			(remote === true) ? scope.switchStatus = true : scope.switchStatus = false;
		}
	}
}]);
//
//###PouchDB Module###END
//


//
//###AppLogic Module###START
//
angular.module("pouchy.pageLogic",[])
.service("$currentDB",function currentDBService() {
	var currentDB;
	this.dbChanger = function(val) {
		currentDB = val;
	}
	this.getDB = function() {
		return currentDB;
	}
})
.controller("mainCtrl",["$scope","$rootScope","$pouchDB","$hashService","$msgBusService","$attrs","$modalService","$currentDB",function mainController($scope,$rootScope,$pouchDB,$hashService,$msgBusService,$attrs,$modalService,$currentDB) {
	var db = $attrs.db;
	$scope.items = [];
	
	$scope.startListening = function(val) {
		$currentDB.dbChanger(db);
		$pouchDB.startListening(val);
	}
	
	$scope.validation = function(val,data) {
		if(val) {
			$scope.addItem(data);
			$modalService.open({template:"success",barColor:"green"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		} else {
			$modalService.open({template:"invalid",barColor:"red"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		}
	}
	
	$scope.addItem = function(data) {
		if(!data["_id"] || data["_id"] === "") data["_id"] = new Date().toISOString();
		if(db === "campaigns_db") {
			data["campid"] = $hashService.hash(data["_id"]).toString();
		}
		$pouchDB.addItem(db,data).then(function(doc) {
			if($scope.userForm) {
				$scope.c = {};
				$scope.userForm.$setPristine();
				$scope.userForm.$setUntouched();
			}
			console.log(doc._id + " created!");
		});
	};
	
	$scope.fetchAll = function(val) {
		$pouchDB.fetchAllDocs(val).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			}
		});
	}
	
	$scope.fetchInitial = function() {
		$scope.fetchAll(db);
		$msgBusService.get(db + ":change",$scope,
			function(event,data) {
				$scope.fetchAll(db);
			}
		);
		$msgBusService.get(db + ":delete",$scope,
			function(event,data) {
				$scope.$apply(function() {
					for(var i=0;i<=$scope.items.length-1;i++) {
						if($scope.items[i].id === data.id) {
							$scope.items.splice(i,1);
							break;
						}
					}
				});
			}
		);
	}
	
	$scope.deleteItem = function(doc) {
		$modalService.open({template:"delete",barColor:"red",data:doc.info}).then(function() {
			$pouchDB.deleteDoc(db,doc.id,doc.rev);
			console.log(doc.id + " deleted");
		},function() {
			console.log("Aborted");
		});
	}
	
	$scope.showModal = function(data) {
		$msgBusService.emit("cid_create:modal");
		$modalService.open({template:"create",barColor:"blue",data:data}).then(function(data) {
			$scope.addItem(data);
			console.log("resolved");
		}, function() {
			console.log("rejected");
		});
	}
	
	//initialize
	$scope.startListening(db);
	$scope.fetchInitial();
}])
.controller("cidCtrl",["$scope","$rootScope","$msgBusService","$pouchDB","$modalService",function cidController($scope,$rootScope,$msgBusService,$pouchDB,$modalService) {
	$scope.intelliAdCampaigns = [];
	$scope.extCampaigns = [];
	$scope.intCampaigns = [];
	$scope.creativeChannel = [];
	
	$msgBusService.get("cid_create:modal",$scope,function() {
		$scope.userForm.$setUntouched();
	});
	
	$scope.checkWID = function(value,intext) {
		var campaign;
		(intext === "extern") ? campaign = "extcampaign" : campaign = "intcampaign";
		$pouchDB.fetchAllDocs("cid_db")
			.then(function(data) {
				var counter = 0;
				for(var i = 0; i<=data.rows.length-1;i++) {
					if(data.rows[i].doc[campaign] === value) {
						counter++;
					}
				}
				counter++;
				var counterLength = counter.toString().length;
				var wid = Array(6-counterLength).join("0") + counter.toString();
				$scope.values.adid = wid;
			});
	};
	
	//fetch other db information
	(function() {$pouchDB.fetchAllDocs("intelliad_db").
		then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				($scope.intelliAdCampaigns).push({
					'name':data.rows[i].doc.name,
					'root':data.rows[i].doc.root,
					'ext':data.rows[i].doc.ext
				});
			};
		}).then(function() {
			return $pouchDB.fetchAllDocs("campaigns_db");
		}).then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				if(data.rows[i].doc.intext === "Extern") {
					($scope.extCampaigns).push(data.rows[i].doc);
				} else {
					($scope.intCampaigns).push(data.rows[i].doc);
				}
			}
		}).then(function() {
			return $pouchDB.fetchAllDocs("channelid_db");
		}).then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				($scope.creativeChannel).push(data.rows[i].doc);
			}
		});
	}())

	$scope.isActive = function(val) {
		if(val === "Extern") {
			$scope.values.intcampaign = "";
			return true;
		} else {
			$scope.values.extcampaign = "";
			$scope.values.extintellicampaign = "";
			return false;
		}
	}
	
	$scope.validation = function(val,data) {
		if(val) {
			$scope.addToDB(data);
			$modalService.open({template:"success",barColor:"green"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		} else {
			$modalService.open({template:"invalid",barColor:"red"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		}
	}
	
	$scope.addToDB = function(data) {
		addedData = $scope.doCIDLogic(data);
		$modalService.resolve(data);
	}
	
	//CID generating logic
	$scope.doCIDLogic = function(data) {
		if(typeof(data.extcampaign) !== "undefined" && data.extcampaign !== "") {
			//add intelliadCamp to new Dataset
			for(var i=0;i<=$scope.intelliAdCampaigns.length-1;i++) {
				if($scope.intelliAdCampaigns[i].name === data.extintellicampaign) {
					data.root = $scope.intelliAdCampaigns[i].root;
					data.ext = $scope.intelliAdCampaigns[i].ext;
					break;
				}
			}
			//add EXTcampaignID to new Dataset
			for(var i=0;i<=$scope.extCampaigns.length-1;i++) {
				if($scope.extCampaigns[i].name === data.extcampaign) {
					data.campaignID = $scope.extCampaigns[i].campid;
					data.campaignType = $scope.extCampaigns[i].type.charAt(0).toLowerCase();
					data.campaignStart = $scope.extCampaigns[i].start;
					data.campaignEnd = $scope.extCampaigns[i].end;
					data.campaignIntExtSuffix = "e";
					break;
				}
			}
		} else {
			//add INTcampaignID to new Dataset
			for(var i=0;i<=$scope.intCampaigns.length-1;i++) {
				if($scope.intCampaigns[i].name === data.intcampaign) {
					data.campaignID = $scope.intCampaigns[i].campid;
					data.campaignType = $scope.intCampaigns[i].type.charAt(0).toLowerCase();
					data.campaignStart = $scope.intCampaigns[i].start;
					data.campaignEnd = $scope.intCampaigns[i].end;
					data.campaignIntExtSuffix = "i";
					break;
				}
			}
		}
		//add ChannelID to new Dataset
		for(var i=0;i<=$scope.creativeChannel.length-1;i++) {
			if($scope.creativeChannel[i].channel === data.creativechannel) {
				data.channelID = $scope.creativeChannel[i].channelID;
				data.channel = $scope.creativeChannel[i].channel;
			}
		}
		
		//generate CID 
		//get globals
		var globals = JSON.parse(document.getElementById("dataConfig").textContent);
		var domainToken = globals.cidConfig.domainToken;
		var organizationToken = globals.cidConfig.organizationToken;
		//if question mark exists then add ampersand and concatenate
		var cid = data.campaignType + "_" + domainToken + "_" + data.channelID + data.campaignIntExtSuffix + "_" + organizationToken + "_" + data.campaignID + "_" + data.adid + "_" + data.randomid;
		if(data.targeturl.indexOf("?") > -1) {
			var FQ = data.targeturl + "&" + cid;
		} else {
		//if no question mark in string then add ampersand + cid
			var FQ = data.targeturl + "?" + cid;
		}
		data.FQ = FQ;
		data.cid = cid;
		
		return data;
	}
}])
.directive("datepicker",function() {
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
})
.directive("validateDate", function validateDateDirective() {
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
})
.directive("widCheck",function widCheckDirective() {
	return {
		link: function(scope,elemt,attr) {
			elemt.bind("change",function() {
				scope.checkWID(elemt[0].value,attr.widCheck);
			});
		}
	}
})
.directive("toolTip",function toolTipDirective() {
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
//
//###AppLogic Module###START
//