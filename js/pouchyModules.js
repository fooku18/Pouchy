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
	var hash = function(val) {
		var hash = 0, i, chr, len;
		if (val.length === 0 || typeof(val) !== "string") return hash;
		for (i = 0, len = val.length; i < len; i++) {
			chr   = val.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
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
//###News Module###START
//
angular.module("pouchy.news",[])
.controller("newsCtrl",["$scope",function newsController($scope) {
	$scope.status = false;
	$scope.statusChange = function() {
		$scope.status = !$scope.status
		if($scope.status) {
			$(".context-content-wrapper").width(window.innerWidth/2);
		} else {
			$(".context-content-wrapper").width(0);
		}
	}
}])
.directive("news",function newsDirective() {
var tmp = 	"<div class='context-info absolute'>" +
				"<div class='context-wrapper' ng-class={'expand':status}>" +
					"<div class='context-expander' ng-click='statusChange()'>" +
						"<div class='context-expander-arrow'>" + 
							"<span class='glyphicon glyphicon-chevron-left glyphicon-20' ng-if='!status'></span>" +
							"<span class='glyphicon glyphicon-chevron-right glyphicon-20' ng-if='status'></span>" +
						"</div>" + 
					"</div>" + 
					"<div class='context-content-wrapper'>" + 
						"<div class='context-content-frame'>" +
							"<div class='context-content-content'>" +
								"<h1>HUND</h1>" +
								"<h1>HUND</h1>" +
								"<h1>HUND</h1>" +
								"<h1>HUND</h1>" +
								"<h1>HUND</h1>" +
								"<h1>HUND</h1>" +
							"</div>" +
						"</div>" + 
					"</div>" +
				"</div>" +
			"</div>";
	return {
		restrict: "E",
		scope: {},
		template: tmp,
		replace: true,
		controller: "newsCtrl",
		link: function(scope,element,attr) {
			
		}
	}
});

//
//###News Module###END
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
						"<div class='custom-modal-dialog' ng-class='{\"custom-modal-stretch\":modalStretch}'>" + 
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
			scope.modalShow = null;
			scope.modalHide = function() {
				$modalService.reject();
				scope.modalShow = null;
				scope.modalTemplate = "templates/modal/success.html";
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
				if(options.template === "create") {
					scope.modalStretch = true;
				} else {
					scope.modalStretch = false;
				}
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
//###Modal Module###END
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
					scope.$apply(function(){
						$modalService.open({template:"fileExtensionError",barColor:"red"}).
						then(function() {
							console.log("resolved");
						},function() {
							console.log("rejected");
						})
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
	/*var database = {};
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
		console.log(remoteDatabase + db);
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
			console.log(err);
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
	}*/
}])
.controller("switchCtrl",["$scope","$pouchDB","DATALAYER","$msgBusService","$modalService","$pouchyModel", function switchController($scope,$pouchDB,DATALAYER,$msgBusService,$modalService,$pouchyModel) {
	$scope.switchChange = function() {
		($scope.switchStatus) ? $pouchyModel.startSyncing() : $pouchyModel.stopSyncing();
	}
	$scope.toggleConfig = function() {
		$scope.showConfig = !$scope.showConfig;
	}
	$msgBusService.get("remoteconnection:lost",$scope,function() {
		$scope.$apply(function() {
			$scope.switchStatus = false;
			$modalService.open({template:"connectionError",barColor:"red",remote:DATALAYER.databaseConfig.remoteUrl}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		})
	});
}])
.directive("switch",["DATALAYER",function switchDirective(DATALAYER) {
	var _global = DATALAYER;
	var couchMode = _global.databaseConfig.dbMode === "couchDB";
	var remote = _global.databaseConfig.autoSync === true;
	
	var tmpConfig = 	"<div class='absolute slider-remote-config-dropdown'>" +
							"<div class='slider-remote-config-framer'>" +
								"<h4>Remote-Einstellungen</h4>" +
								"<div class='slider-remote-config-content'>" +
									"<div class='slider-remote-config-content-part1'>" +
										"Remote-Url: " +
									"</div>" +
									"<div class='slider-remote-config-content-part2'>" +
										"<input type='text' class='form-control' />" +
									"</div>" +
								"</div>" +
								"<div class='slider-remote-config-content'>" +
									"<div class='slider-remote-config-content-part1'>" +
										"Login: " +
									"</div>" +
									"<div class='slider-remote-config-content-part2'>" +
										"<input type='text' class='form-control' />" +
									"</div>" +
								"</div>" +
								"<div class='slider-remote-config-content'>" +
									"<div class='slider-remote-config-content-part1'>" +
										"Passwort: " +
									"</div>" +
									"<div class='slider-remote-config-content-part2'>" +
										"<input type='password' class='form-control' />" +
									"</div>" +
								"</div>" +
							"</div>" +
							"<center class='margin-bottom-15'><button class='btn btn-default'>Log-In</button></center>" +
						"</div>";
	return {
		restrict: "E",
		scope: {},
		replace: true,
		controller: "switchCtrl",
		template: 	"<div class='inline-block'>" +
						"<div class='slider-wrapper relative' ng-class={'show-config':showConfig}>" +
							"<div class='inline-block padding-left-25' ng-show='showSwitch'>" +
								"<div class='small-letters white'>Sync Mode</div>" +
								"<div>" +
									"<label class='switch'>" +
										"<input id='switcher' type='checkbox' ng-model='switchStatus' ng-click='switchChange()'>" +
										"<div class='slider round'></div>" +
									"</label>" +
								"</div>" +
							"</div>" + 
							"<div class='inline-block slider-remote-message'>" +
								"<div class='slider-remote-message-content'>" +
									"<span ng-if='switchStatus' class='slide-remote-online'>ONLINE</span>" +
									"<span ng-if='!switchStatus' class='slide-remote-offline'>OFFLINE</span>" +
								"</div>" + 
							"</div>" +
							"<div class='inline-block slider-remote-config' ng-click='toggleConfig()' ng-init='showConfig = false'>" +
								"<span class='glyphicon glyphicon-cloud glyphicon-30 glyphicon-a'></span>" +
							"</div>" +
							tmpConfig +
						"</div>" +
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
//###PouchyModel Module###START
//
angular.module("pouchy.model",[])
//this factory serves as a model distributor for interested parties. the factory gets updated with every UI change
.factory("$pouchyModelDatabase",["$msgBusService",function pouchyModelDatabaseFactory($msgBusService) {
	function dataBaseFn(name,val) {
		database[name] = val;
		console.log(database);           // <---------------------------------------------DELETE
	};
	var database = {};
	return {
		database: database,
		dataBaseFn: dataBaseFn
	}
}])
//pouchy model is the heart of the application. it initializes the pouchdb databases on app launch and keeps the container
//up to date on any UI change. the model changes are saved in the above factory which serves as a data distributor
.service("$pouchyModel",["$q","DATALAYER","$msgBusService","$pouchyModelDatabase",function pouchyModelService($q,DATALAYER,$msgBusService,$pouchyModelDatabase) {
	var self = this;
	this.dbCount = 0;
	this.syncHandlerCount = [];
	this.databaseContainer = {};
	//the service catches all databases and sync them
	this.startSyncing = function() {
		var remote = DATALAYER.databaseConfig.remoteUrl || "";
		if(self.dbCount === DATALAYER.databaseConfig.databases.length) {
			for(var key in self.databaseContainer) {
				if(self.databaseContainer[key].db._events.destroyed.length > 4) {
					self.databaseContainer[key].db._events.destroyed = self.databaseContainer[key].db._events.destroyed.slice(0,4);
				}
				syncHandler = self.databaseContainer[key].db.sync(remote + key,{
					live: true,
					retry: false
				}).on("error",function(err) {
					console.log(err);
					self.syncHandlerCount = [];
					$msgBusService.emit("remoteconnection:lost");
				}).on("complete",function(info) {
					console.log(info);
				});
				self.syncHandlerCount.push(syncHandler);
			}
		}
	}
	this.stopSyncing = function() {
		if(self.syncHandlerCount) {
			angular.forEach(self.syncHandlerCount,function(key) {
				key.cancel();
			});
		}
	}
	this.initDatabase = function(databaseName) {
		function updateViewModel() {
			db.allDocs({
				descending: true,
				include_docs: true
			}).then(function(docs) {
				var model = [];
				for(var i=0;i<docs.rows.length;i++) {
					model.push(docs.rows[i]);
				}
				$pouchyModelDatabase.dataBaseFn(dbName,model);
				$msgBusService.emit(dbName + ":change", $pouchyModelDatabase.database[dbName]);
			},function(err) {
				console.log(err);
			});
		}
		function addItem(data) {
			var defer = $q.defer();			
			db.put(data).then(function() {
				console.log("resolved");
				defer.resolve(data);
			}, function() {
				console.log("rejected");
				defer.reject();
			});
			return defer.promise;			
		}
		function deleteItem(id,rev) {
			var defer = $q.defer();
			db.remove(id,rev).then(function(data) {
				console.log("deleted");
				defer.resolve(data);
			}, function() {
				defer.reject();
			});
			return defer.promise;
		}
		var dbName;
		var db = new PouchDB(databaseName);
		//dbCount counts up to the max number of databases - this is necessary so that the syncing process only starts when
		//all databases are set up
		self.dbCount++;
		dbName = databaseName;
		//this method kicks in the auto sync mode for pouchdb
		db.changes({
			since: "now",
			live: true,
			include_docs: true
		}).on("change",updateViewModel);
		//the databaseContainer contains all databases and relevant methods for adding, updating, deleting and 
		//auto-updating datasets in its enclosed database scope
		self.databaseContainer[dbName] = {
			db: db,
			addItem: addItem,
			deleteItem: deleteItem
		}
		//initial view model update - this kicks in the scope for the current UI tab
		updateViewModel();
		//auto syncing attempt - if unsuccessful app will work in offline mode
		//although the user has the choice to retry syncing in UI - there is an option to change the standart remote options in UI
		self.startSyncing();
	}
}])
//mainCtrl is initilized on every new tab - this is to prevent too much scope overhead for non relevant data as 
//all database data is present in the background service
.controller("mainCtrl",["$scope","$rootScope","$pouchyWorker","$hashService","$msgBusService","$attrs","$modalService","$pouchyModel","$pouchyModelDatabase",function mainController($scope,$rootScope,$pouchyWorker,$hashService,$msgBusService,$attrs,$modalService,$pouchyModel,$pouchyModelDatabase) {
	//fetch database name from template attribute - this is important to seperate the data from the model service
	var db = $attrs.db;
	//initial on scope creation in case model already exists
	(function() {
		$scope.items = $pouchyModelDatabase.database[db];
		console.log($pouchyModelDatabase.database[db]); // <-----------------------------------DELETE
	}());
	//update scope if model changes due UI-input
	$msgBusService.get(db + ":change",$scope,function(event,data) {
		$scope.$apply(function() {
			$scope.items = data;
		});
	});
	//UI input data need to be validated before pouch/couch is updated. Validation is defined on the relevant userforms
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
		//clean input fields from validation errors after button fired
		$scope.c = {};
		$scope.userForm.$setPristine();
	}
	//if validation succeeds UI data is beeing added
	$scope.addItem = function(data) {
		//concatenate and hash input -> use as couchdb _id
		var hashVal = (function(data) {
			var conc = "";
			for(var key in data) {
				if(data.hasOwnProperty(key)) {
					conc += data[key];
				}
			}
			return Math.abs($hashService.hash(conc)).toString();
		})(data);
		data["_id"] = hashVal;
		$pouchyModel.databaseContainer[db].addItem(data);
	}
	//UI delete data
	$scope.deleteItem = function(doc) {
		$modalService.open({template:"delete",barColor:"red",data:doc.info}).then(function() {
			$pouchyModel.databaseContainer[db].deleteItem(doc.id,doc.rev);
			console.log(doc.id + " deleted");
		},function() {
			console.log("Aborted");
		});
	}	
}])
//jqueryUI date picker 
.directive("datepicker",function datepickerDirective() {
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
//date validator - start date needs to be before end date otherwise the form gets invalid. 
//date validator modifies ngModel for this purpose
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
});
//
//###PouchyModel Module###END
//

//
//###CID-Logic Module###START
//
angular.module("pouchy.cidLogic",[])
.controller("cidCtrl",["$scope","$msgBusService","$pouchyModel","$modalService","$pouchyWorker","$pouchyModelDatabase","$hashService",function cidController($scope,$msgBusService,$pouchyModel,$modalService,$pouchyWorker,$pouchyModelDatabase,$hashService) {
	$scope.intelliAdCampaigns = [];
	$scope.extCampaigns = [];
	$scope.intCampaigns = [];
	$scope.creativeChannel = [];
	//initial combobox filling for the cid create modal window
	(function() {
		//intelliAdCampaigns filling
		var fn = 	"function(doc) {" + 
						"var campaigns = [];" +
						"for(var i=0;i<doc.length;i++) {" +
							"campaigns.push({" +
								"name: doc[i].doc.name," +
								"root: doc[i].doc.root," +
								"ext: doc[i].doc.ext" +
							"});" +
						"}" + 
						"return campaigns;" +
					"}";
		$pouchyWorker.callWorker("intelliad_db",fn).then(function(doc) {
			$scope.intelliAdCampaigns = doc;
		});
		//int/ext campaigns filling
		fn =	"function(doc) {" + 
					"var intcampaigns = [];" +
					"var extcampaigns = [];" +
					"for(var i=0;i<doc.length;i++) {" +
						"if(doc[i].intext === 'Extern') {" +
							"extcampaigns.push(doc[i].doc);" +
						"} else {" +
							"intcampaigns.push(doc[i].doc);" +
						"}" +
					"}" + 
					"return [intcampaigns,extcampaigns];" +
				"}";
		$pouchyWorker.callWorker("campaigns_db",fn).then(function(doc) {
			$scope.intCampaigns = doc[0];
			$scope.extCampaigns = doc[1];
		});
		fn =	"function(doc) {" +
					"var channels = [];" +
					"for(var i=0;i<doc.length;i++) {" +
						"channels.push(doc[i].doc);" +
					"}" + 
					"return channels;" +
				"}";
		$pouchyWorker.callWorker("channelid_db",fn).then(function(doc) {
			$scope.creativeChannel = doc;
		});
	}())
	$scope.checkWID = function(value,intext) {
		var campaign;
		(intext === "extern") ? campaign = "extcampaign" : campaign = "intcampaign";
		var counter = 0;
		for(var i=0; i<$pouchyModelDatabase.database["cid_db"].length; i++) {
			if($pouchyModelDatabase.database["cid_db"][i].doc[campaign] === value) counter++;
		}
		counter++
		var counterLength = counter.toString().length;
		var wid = Array(6-counterLength).join("0") + counter.toString();
		$scope.values.adid = wid;
	};
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
		if(val) $scope.addItem(data);
	}
	$scope.addItem = function(data) {
		//concatenate and hash input -> use as couchdb _id
		var hashVal = (function(data) {
			var conc = "";
			for(var key in data) {
				if(data.hasOwnProperty(key)) {
					conc += data[key];
				}
			}
			return Math.abs($hashService.hash(conc)).toString();
		})(data);
		data["_id"] = hashVal;
		$pouchyModel.databaseContainer["cid_db"].addItem(data);
	}
}])
.factory("cidLogic",["DATALAYER","$pouchyModelDatabase","$msgBusService",function cidLogicFactory(DATALAYER,$pouchModelDatabase,$msgBusService) {
	function createCID() {
		/*
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
	}*/
	}
	
	return {
		createCID: createCID
	}
}])
.directive("cidModal",["$pouchyModelDatabase",function($pouchyModelDatabase) {
	return {
		restrict: "A",
		scope: true,
		controller: "cidCtrl",
		link: function(scope,element,attr) {
			console.log($pouchyModelDatabase.database);
		}
	}
}])
.directive("cidModalCaller",["$modalService",function cidModalDirective($modalService) {
	return {
		restrict: "A",
		scope: {
			cidData: "="
		},
		link: function(scope,element,attr) {
			element.on("click",function() {
				scope.$apply(function() {
					$modalService.open({template:"create",barColor:"white",data:scope.cidData}).
					then(function() {
						console.log("resolved");
					},function() {
						console.log("rejected");
					})
				});
			});
		}
	}
}])
.directive("widCheck",function widCheckDirective() {
	return {
		link: function(scope,elemt,attr) {
			elemt.bind("change",function() {
				scope.checkWID(elemt[0].value,attr.widCheck);
			});
		}
	}
})
//
//###CID-Logic Module###END
//

//
//###Worker Module###START
//
angular.module("pouchy.worker",[])
.service("$pouchyWorker",["$pouchyModelDatabase","$q",function pouchyWorkerService($pouchyModelDatabase,$q) {
	//the following two functions are necessary to transform data to arraybuffers
	//this gives us the opportunity to transfer data to the worker instead of just 
	//cloning it and then passing it over - this will give the process some boost
	//arraybuffer to string
	//
	//in order to use the worker we have to define our function as a string and name
	//the database that contains our raw data. the callWorker method wraps the task
	//into a promise and responds when finished - this enables us to use the worker 
	//response in our controller.
	//
	//    EXAMPLE USAGE:
	//---------------------------------------------------------------------------------
	//		var fn = 	"function(doc) {" + 
	//						"var id = [];" +
	//						"for(var i=0;i<doc.length;i++) {" +
	//							"id.push(doc[i].id);" +
	//						"}" + 
	//						"return id;" +
	//					"}";
	//			$pouchyWorker.callWorker("campaigns_db",fn).then(function(doc) {
	//				//proceed with result...
	//			});
	//---------------------------------------------------------------------------------
	//
	//string to arraybuffer converter - the inverse function is wrapped in the worker.js file
	//we use uft-16 charset so that we need 2bytes for each charater
	function str2ab(str) {
		var buf = new ArrayBuffer(str.length*2);
		var bufView = new Uint16Array(buf);
		for (var i=0;i<str.length;i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}
	
	function serviceCaller(db,fn) {
		var defer = $q.defer();
		//$pouchDB.fetchAllDocs(db).then(function(doc) {
			var doc = $pouchyModelDatabase.database[db];
			var worker = new Worker("worker/datasetWorker.js");
			worker.addEventListener("message",function(e) {
				defer.resolve(e.data);
			},false);
			//var workerParameter = {doc:JSON.stringify(doc),fn:fn};
			var workerParameter = JSON.stringify(doc) + "UNIQUE_SEPERATOR" + fn;
			var ab = str2ab(workerParameter)
			worker.postMessage(ab);
		//});
		return defer.promise;
	}
	
	return {
		callWorker: serviceCaller
	}
}]);
//
//###Worker Module###END
//