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
.controller("naviCtrl",["$scope","$location",function naviController($scope,$location) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
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
.directive("sitetitle",["routeNavi","$location",function sitetitleDirective(routeNavi,$location) {
	return {
		restrict: "E",
		template: "<div class='title'><h1>{{title}}</div></h1></div>",
		replace: true,
		controller: ["$scope",function($scope) {
			$scope.$on("$locationChangeSuccess",function(e) {
				for(var i=0; i<=routeNavi.routes.length-1;i++) {
					if(routeNavi.routes[i].path === $location.path()) $scope.title = routeNavi.routes[i].name;
				}
			});
		}]
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
		controller: ["$scope",function($scope) {
			this.modalHideCtrl = function() {
				$scope.modalShow = false;
				$scope.modalTemplate = "templates/modal/success.html";
			}
		}],
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
		}
	}
}]);
//
//###Modal Module###END
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
			if(input === undefined) return 0;
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
	/**
	 * Export File 
	 *
	 * exports current databases and data in desired format
	 *
	 * @param {string} fileName
	 * @param {object} data
	 * @return {void}
	 */
	function exportjson(fileName,data) {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		var json = JSON.stringify(data),
		url = "data:application/json,";
		a.href = url + json;
		a.download = fileName;
		a.click();
		document.removeChild(a);
	}
	
	function exportcsv(fileName,data) {
		var dataStream,
			x;
		for(var key in data) {
			x=0;
			dataStream += "#########" + key + "#########" + "\n";
			for(var a=0;a<data[key].length;a++) {
				if((data[key][a].id).substr(0,7) === "_design") {
					x++;
				}
			}
			for(var k in data[key][x].doc) {
				dataStream += k + ";" 
			}
			dataStream += "\n";
			for(var i=x	;i<data[key].length;i++) {
				for(var k in data[key][i].doc) {
					dataStream += data[key][i].doc[k] + ";";
				}
				dataStream += "\n";
			}
		}
		var encodedStream = encodeURIComponent(dataStream);
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		url = "data:text/csv;charset=utf-8,";
		a.href = url + encodedStream;
		a.download = fileName;
		a.click();
		document.removeChild(a);
	}
	
	return {
		exportjson: exportjson,
		exportcsv: exportcsv
	}
})
.directive("downloadPop",["exportFactory","$pouchyModelDatabase",function downloadPopDirective(exportFactory,$pouchyModelDatabase) {
	var tmp = 	"<div class='importexport-wrapper relative'>" +
					"<div class='importexport-icons'>" + 
						"<span data-id='export' class='importexport lg glyphicon glyphicon-save glyphicon-30 glyphicon-a'></span>" +
						"<span data-id='import' class='importexport lg glyphicon glyphicon-open glyphicon-30 glyphicon-a'></span>" +
					"</div>" +
					"<div class='importexport-menu absolute'>" + 
						"<div class='importexport-framer'>" +
							"<h4 ng-if='import'>Import</h4>" +
							"<h4 ng-if='!import'>Export</h4>" +
							"<div class='importexport-content' ng-show='export'>" + 
								"<button class='btn btn-default importexport-btn' ng-click='getFile(\"json\")'>JSON</button>" +
								"<button class='btn btn-default importexport-btn' ng-click='getFile(\"csv\")'>CSV</button>" +
							"</div>" + 
							"<div class='importexport-content' ng-show='import'>" + 
								"<label class='btn btn-default importexport-btn' file-reader>JSON" + 
								"<input type='file' class='display-none' />" + 
								"</label>" +
								"<label class='btn btn-default importexport-btn' file-reader>CSV" + 
								"<input type='file' class='display-none' />" + 
								"</label>" +
							"</div>" + 
						"</div>" +
					"</div>" +
				"</div>";
	return {
		restrict: "A",
		scope: {},
		template: tmp,
		link: function(scope,element,attr) {
			scope.getFile = function(format) {
				var date = new Date().toISOString();
				if(format === "json") exportFactory.exportjson("export_json.json",$pouchyModelDatabase.database);
				if(format === "csv") exportFactory.exportcsv("export_csv.csv",$pouchyModelDatabase.database);
			};
			element.on("click",function(e) {
				if(!e.target.attributes["data-id"]) return;
				if(e.target.attributes["data-id"].value === "import") {
					scope.import = true;
					scope.export = false;
				}
				if(e.target.attributes["data-id"].value === "export") {
					scope.import = false;
					scope.export = true;
				}
				scope.$apply();
			});
			$(document).click(function(e) {
				if(e.target.className.indexOf("importexport") === -1) {
					$(element[0].querySelector(".importexport-wrapper")).removeClass("importexport-wrapper-dropdown");
				} else {
					if(!e.target.attributes["data-id"]) return;
					$(element[0].querySelector(".importexport-wrapper")).addClass("importexport-wrapper-dropdown");
				}
			});
		}
	}
}]);
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
		scope: {
			
		},
		link: function(scope,element,attr,ctrl) {
			element.on("change",function(changeEvent) {
				var file = changeEvent.target.files[0];
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
						console.log(scope);
					});
				}
				reader.onprogress = function(event) {
					console.log(event);
					scope.$apply();
				}
				reader.readAsText(changeEvent.target.files[0]);
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
	this.query = function(dbase,data,includeDocs,key) {
		var defer = $q.defer();
		var options = {};
		if(includeDocs) options.include_docs = true;
		if(key) options.key = key;
		this.databaseContainer[dbase].db.query(data,options).then(function(doc) {
			defer.resolve(doc);
		}, function() {
			defer.reject();
		});
		return defer.promise;
	}
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
					$msgBusService.emit("remoteconnection:lost");
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
				defer.resolve(data);
			}, function() {
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
.controller("mainCtrl",["$scope","$pouchyWorker","$hashService","$msgBusService","$attrs","$modalService","$pouchyModel","$pouchyModelDatabase","$filter","$pouchyDesignViews",function mainController($scope,$pouchyWorker,$hashService,$msgBusService,$attrs,$modalService,$pouchyModel,$pouchyModelDatabase,$filter,$pouchyDesignViews) {
	//fetch database name from template attribute - this is important to seperate the data from the model service
	var db = $attrs.db;
	$scope.changeSortType = function(val) {
		if($scope.sortType === val) $scope.sortDescending = !$scope.sortDescending;
		$scope.sortType = val;
	};
	//initial on scope creation in case model already exists
	(function() {
		//initial filter -> orderBy descending creationdate
		$scope.sortType = "doc.creationdate";
		$scope.sortDescending = true;
		$scope.items = angular.copy($pouchyModelDatabase.database[db]);
		//filter by creationdate
		//$scope.items = $filter("orderBy")($scope.items,"doc.creationdate");
		console.log($pouchyModelDatabase.database[db]); // <-----------------------------------DELETE
	})();
	//update scope if model changes due UI-input
	$msgBusService.get(db + ":change",$scope,function(event,data) {
		$scope.$apply(function() {
			$scope.items = angular.copy(data);
			//filter by creationdate
			$scope.items = $filter("orderBy")($scope.items,"doc.creationdate");
		});
	});
	//UI input data need to be validated before pouch/couch is updated. Validation is defined on the relevant userforms
	$scope.validation = function(val,data) {
		if(val.$valid) {
			$scope.addItem(val,data);
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
		//clean input fields from validation errors after button fired and submitted from new value input form
		if(val.$name !== "userFormChange") {
			$scope.c = {};
			$scope.userForm.$setPristine();
		}
	}
	//if validation succeeds UI data is beeing added
	$scope.addItem = function(val,data) {
		//if this submission is not an update then create new id as hash
		if(!data._id) {
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
			//add the hash value to the datasets _id property - this be the unique
			//identifier for the dataset. in case someone creates a dataset with exactly
			//the same properties (except start and end dates) the _ids are equal and the
			//dataset only gets updated. this is to prevent duplicates
			data["_id"] = hashVal;
			//add creation date do dataset - this is handy for sorting issues
			data["creationdate"] = new Date().toISOString();
		//if _id already exists the dataset only needs to get updated - pouch/couch will
		//will take care of this automatically and will add a new revision to the dataset
		} else {
			//extra behaviour due campaign data changes - if several properties get changed the 
			//main cid pool of datasets needs to get updated too. these datasets also need to be 
			//flagged as not up to date relating to SAINT classification
			var a = [],
				changedData = {},
				identifier,idx,
				targetDB = "cid_db";
							
			identifier = db.substr(0,db.indexOf("_"));
			idx = $pouchyDesignViews.design(identifier);
			console.log(data);
			console.log("CHANGED: " + data._id);
			/**	
			*	query cid_db for the changed data from campaigns_db
			*
			*	@param {String,String,Boolean,String} (DatabaseName,IndexName,IncludeDocs,SearchKey)
			*   @param {string} idx
			*   @param {boolean} includeDocs
			*	@return {Promise} returned promise contains matching data
			*/
			$pouchyModel.query(targetDB,idx,true,data._id).then(function(doc) {
				console.log(doc);
				if(doc.rows.length) {
					console.log(doc);
					//copy changed values into new object which later changes all matching cid datasets
					var changedData = {};
					angular.forEach(data,function(val,key) {
						if(key !== "_id" && key !== "_rev" && key !== "type" && key !== "intext") {
							changedData[key] = val;
						}
					});
					var a = [];
					for(var i=0;i<doc.rows.length;i++) {
						angular.forEach(changedData,function(val,key) {
							doc.rows[i].doc[identifier + "_" + key] = val;
							//add time stamp of last modification
							doc.rows[i].doc.modified = new Date().toISOString();
						});
						a.push(doc.rows[i].doc);
					}
					$pouchyModel.databaseContainer.cid_db.db.bulkDocs(a).then(function(res) {
						console.log(res);
					},function(err) {
						console.log(err)
					});
				}
			},function(err) {
				console.log(err);
			});
		}
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
	//Call the cid modal window for creating new cid or updating existing one
	$scope.cidModal = function(data) {
		//deep copy of values as we dont want to pass the reference
		var copyData = (!data) ? data : angular.copy(data);
		//send data to cidModal window for creation/update
		$modalService.open({template:"create",barColor:"white",data:copyData}).
		then(function() {
			console.log("resolved");
		},function() {
			console.log("rejected");
		});
	}
}])
.service("$pouchyDesignViews",["$pouchyModel",function($pouchyModel) {
	function createDesignView(indexName) {
		var idx = "index_" + indexName;
		var mapStr = "function(doc) {emit(doc." + indexName + "_id)}";
		var ddoc = {};
		ddoc._id = "_design/" + idx;
		ddoc.views = {};
		ddoc.views[idx] = {};
		ddoc.views[idx].map = mapStr;
		
		$pouchyModel.databaseContainer["cid_db"].addItem(ddoc).then(function() {
			return $pouchyModel.query("cid_db",idx,false,false);
		}).then(function() {
			console.log("_designView created");
		});
		
		return idx
	}
	
	return {
		design: createDesignView
	}
}])
//this filter removes the _design views from the view representation in UI
//views are couch/pouch'es way to index datasets and query secondary indexes
.filter("removeDesigns",function() {
	return function(data) {
		var newSet = [];
		angular.forEach(data,function(val,key) {
			if((val.id).substr(0,7) !== "_design") newSet.push(val);
		});
		return newSet;
	}
})
.filter("dateFormatDE",function() {
	return function(val) {
		return val.substr(8,2) + "." + val.substr(5,2) + "." + val.substr(0,4);
	}
})
//bootstrapUI date picker 
.directive("datepicker",function datepickerDirective() {
	return {
		restrict: "A",
		link: function(scope,elem,attr) {
			$(elem).datepicker({
				format: "dd.mm.yyyy",
				calendarWeeks: true,
				orientation: "bottom left",
				autoclose: true,
				language: "de",
				todayHighlight: true
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
})
.directive("onOffSwitch",["$pouchySAINTAPI","DATALAYER","$pouchyModel",function($pouchySAINTAPI,DATALAYER,$pouchyModel) {
	var tmp = 	"<div class='main-center relative'>" +
					"<button type='button' class='btn btn-circle btn-circle-lg btn-outline-none rotate-360' ng-class='getClass()'>" +
						"<span class='glyphicon' ng-class='getIcon()'></span>" +
					"</button>" + 
					"<div class='main-fluid-action absolute'>" +
						"<button type='button' ng-click='switchSAINT()' class='btn btn-circle btn-danger btn-fluid rotate-360'>" +
							"<span class='glyphicon glyphicon-remove'></span>" +
						"</button>" + 
						"<button type='button' ng-click='switchSAINT()' class='btn btn-circle btn-success btn-fluid rotate-360'>" +
							"<span class='glyphicon glyphicon-ok'></span>" +
						"</button>" + 
					"</div>" +
				"</div>";
	return {
		template: tmp,
		link: function(scope,element,attr) {
			(function() {
				var fn = function(el) {
					$(el).fadeToggle();
				};
				var elmt = $(element);
				var chldrn = elmt.find(".main-fluid-action").children();
				var btn = elmt.find(".btn-circle-lg").first()[0];
				elmt.first().click(function() {
					var t = 0;
					chldrn.each(function(key,val) {
						setTimeout(function() {
							fn(val);
						},t);
						t += 200;
					});
				});
			}());
			scope.getClass = function() {
				if(scope.item.doc.saintstatus) {
					return "btn-success";
				} else {
					return "btn-danger";
				}
			}
			scope.getIcon = function() {
				if(scope.item.doc.saintstatus) {
					return "glyphicon-ok";
				} else {
					return "glyphicon-remove";
				}
			}
			scope.switchSAINT = function() {
				/**
				*	If checkbox is unchecked we will use the SAINT API to upload our new classification dataset.
				*	The process is simply a chain of http requests as there are multiple steps necessary to url
				*	a dataset with SAINT. Before the new key can be uploaded we check the classification template
				*	and fill the columns according to the template.
				*
				*	The process is as follows:
				*
				*	Get Template -> Create Import -> Retrieve Job ID -> Populate Import -> Commit Import (Insert Job ID) -> Success/Failure
				*/
				if(scope.item.doc.saintstatus === false) {
					var _id;
					var conf = {
						"encoding":"utf-8",
						"rsid_list":[
							"deutschepostwpmdhlmpdev2"
						]
					}
					conf.element = DATALAYER.analyticsConfig.classification_element;
					$pouchySAINTAPI.requestSAINT("Classifications.GetTemplate",conf)
					.then(function(res) {
						var s = res.data[0].template.split("\r\n");
						var sn = s[3].split("\t");
						var conf = {
							"check_divisions":"1",
							"description":"Classification Upload API",
							"export_results":"0",
							"overwrite_conflicts":"0",
						}
						conf.element = DATALAYER.analyticsConfig.classification_element;
						conf.email_address = DATALAYER.analyticsConfig.notification_email_address;
						conf.header = sn;
						conf.rsid_list = [DATALAYER.analyticsConfig.reportSuite];
						return $pouchySAINTAPI.requestSAINT("Classifications.CreateImport",conf);
					}).then(function(res) {
						if(res) {
							_id = res.data["job_id"];
							var conf = {
								"page":"1",
								"rows":[]
							}
							conf["job_id"] = _id;
							conf.rows.push({
								"row": [scope.item.doc.cid,scope.item.doc.campaign_type,scope.item.doc.campaign_id,scope.item.doc.campaign_start,scope.item.doc.campaign_end,scope.item.doc.placement,scope.item.doc.adtype,scope.item.doc.creative_channel,DATALAYER.cidConfig.domainToken]
							});
							return $pouchySAINTAPI.requestSAINT("Classifications.PopulateImport",conf);
						}
					}).then(function(res) {
						if(res) {
							var conf = {};
							conf["job_id"] = _id;
							return $pouchySAINTAPI.requestSAINT("Classifications.CommitImport",conf);
						}
					}).then(function(res) {
						scope.item.doc.saintstatus = !scope.item.doc.saintstatus;
						return $pouchyModel.databaseContainer["cid_db"].addItem(scope.item.doc);
					}).then(function(res) {
						console.log(res);
					}).catch(function(err) {
						console.log(err);
					});
				} else {
					console.log(scope.item.doc);
				}
			}
		}
	}
}])
.factory("$pouchySAINTAPI",["$http","DATALAYER",function pouchySAINTFactory($http,DATALAYER) {
	//WSSE is a hash library provided by Adobe
	var wsse = new Wsse();
	/**
	*	SAINT (RESTful API) implementation for Classification in Adobe Analytics
	*	@params {string} method - method to be executed from SAINT API
	*	@params {object} params - parameters to be passed to the method
	*	@return {Promise}
	*/
	function requestSAINT(method,params) {
		var x = wsse.generateAuth(DATALAYER.analyticsConfig.username,DATALAYER.analyticsConfig.secret)["X-WSSE"];
		return $http({
			method: "POST",
			url: "https://" + DATALAYER.analyticsConfig.endpoint + "/admin/1.4/rest/?method=" + method,
			headers: {
				"X-WSSE": x
			},
			data: params
		});
	}
	
	return {
		requestSAINT: requestSAINT
	}
}])
.directive("contextMenu",function($compile) {
	return {
		restrict: "A",
		controller: function($scope) {
			$scope.values = {};
			$scope.copyValue = function (value) {
				var inp,
					range,
					selection;
				inp = $("div[data-id='" + value + "']").get(0);
				range = document.createRange();
				range.selectNodeContents(inp);
				selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				try {
					document.execCommand("copy",false,null);
				} catch(e) {
					console.log("execCommand not supported");
				}
			}
		},
		compile: function(tElement,tAttribute) {
			var html = 	"<div id='contextMenu' class='context-menu-wrapper'>" + 
							"<ul class='context-menu-framer'>" + 
								"<li class='context-menu-li' ng-repeat='(key,value) in values'>" +
									"<a class='context-menu-li-content'>" +
										"{{key}}: " + 
										"<div data-id='{{key}}' class='inline-block' ng-click='copyValue(key)'>{{value}}</div>" +
									"</a>" +
								"<li>" + 
							"</ul>" +
						"</div>";
			tElement.append(html);
			
			return {
				post: function(scope,element,attr) {
					$(element).on("contextmenu", function(e) {
						e.preventDefault();
						e.stopPropagation();
						var node = e.target;
						while(node.className.indexOf("main-table-tr") === -1) {
							node = node.parentElement;
						}
						var data = JSON.parse(node.getAttribute("data-context-info"));
						var newData = {};
						for(var key in data) {
							if(key !== "_rev" && key !== "_id") {
								newData[key] = data[key];
							}
						}
						scope.values = newData;
						scope.$apply(function() {
							var contextMenu = $("#contextMenu");
							var widthCorrection = contextMenu.width() / 2;
							element.addClass("context-menu-show");
							var O_O_top = $("#context-0-0").position().top;
							var O_O_left = $("#context-0-0").position().left;
							contextMenu.css({
								top: (e.clientY - O_O_top + 20) + "px",
								left: (e.clientX - O_O_left - widthCorrection) + "px"
							});
						});
					});
					$(document).click(function(e) {
						var target = e.target;
						if(target.className.indexOf("context-menu-li-content") === -1) {
							element.removeClass("context-menu-show");
						}
					});
				}
			}
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
//this controller is more or less a copy of the main controller with slightly changes in favor of 
//different initial work and processes for cid creation
.controller("cidCtrl",["$scope","$msgBusService","$pouchyModel","$modalService","$pouchyWorker","$pouchyModelDatabase","$hashService","$pouchyCIDLogic",function cidController($scope,$msgBusService,$pouchyModel,$modalService,$pouchyWorker,$pouchyModelDatabase,$hashService,$pouchyCIDLogic) {
	$scope.intelliAdCampaigns = [];
	$scope.extCampaigns = [];
	$scope.intCampaigns = [];
	$scope.creativeChannel = [];
	//initial combobox filling for the cid create modal window
	(function() {
		//intelliAdCampaigns filling
		var fn = 	"function(doc) {" + 
						"var intellis = [];" +
						"for(var i=0;i<doc.length;i++) {" +
							"intellis.push(doc[i].doc);" +
						"}" + 
						"return intellis;" +
					"}";
		$pouchyWorker.callWorker("intelliad_db",fn).then(function(doc) {
			$scope.intelliAdCampaigns = doc;
		});
		//int/ext campaigns filling
		fn =	"function(doc) {" + 
					"var intcampaigns = [];" +
					"var extcampaigns = [];" +
					"for(var i=0;i<doc.length;i++) {" +
						"if(doc[i].doc.intext === 'Extern') {" +
							"extcampaigns.push(doc[i].doc);" +
						"} else {" +
							"intcampaigns.push(doc[i].doc);" +
						"}" +
					"}" + 
					"return [intcampaigns,extcampaigns];" +
				"}";
		$pouchyWorker.callWorker("campaign_db",fn).then(function(doc) {
			$scope.intCampaigns = doc[0];
			$scope.extCampaigns = doc[1];
		});
		//channel ID filling
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
	//this function serves as an wid checker and increases the number in case that 
	//some other dataset already exists with given number
	$scope.counter = function(camp,val) {
		var counter = 0;
		for(var i=0; i<$pouchyModelDatabase.database["cid_db"].length; i++) {
			if($pouchyModelDatabase.database["cid_db"][i].doc[camp] === val) counter++;
		}
		counter++
		var counterLength = counter.toString().length;
		var wid = Array(6-counterLength).join("0") + counter.toString();
		$scope.values.adid = wid;
	}
	//changes the cid UI in case of external or internal campaign
	$scope.isActive = function(val) {
		var a = (val === "Extern") ? true : false;
		return a;
	}
	$scope.intextChanger = function(data) {
		if(data === "Intern") {
			delete $scope.values.intelliad_name;
		}
	}
	$scope.validation = function(val,data) {
		if(val.$valid) {
			var data = $pouchyCIDLogic.createCID(data,$scope.intelliAdCampaigns,$scope.extCampaigns,$scope.intCampaigns,$scope.creativeChannel);
			$scope.addItem(data);
		}
	}
	$scope.addItem = function(data) {
		//if new cid then assign _id as creation data otherwise the cid gets overwritten with
		//new values from the update formular
		if(!data["_id"]) data["_id"] = new Date().toISOString();
		console.log(data);
		$pouchyModel.databaseContainer["cid_db"].addItem(data);
		$scope.hide();
	}
}])
//this factory serves as the cid generator logic. the services receives all necessary information
//about the data input and creates a unique cid and if desired an intelliad link wrapper.
.factory("$pouchyCIDLogic",["DATALAYER","$pouchyModelDatabase","$msgBusService",function pouchyCIDLogicFactory(DATALAYER,$pouchyModelDatabase,$msgBusService) {
	function createCID(data,intelliAdCampaigns,extCampaigns,intCampaigns,creativeChannel) {
		if(data.campaign_intext === "Extern") {
			//add intelliadCamp to new Dataset
			for(var i=0;i<=intelliAdCampaigns.length-1;i++) {
				if(intelliAdCampaigns[i].name === data.intelliad_name) {
					data.intelliad_id = intelliAdCampaigns[i]._id;
					data.intelliad_root = intelliAdCampaigns[i].root;
					data.intelliad_ext = intelliAdCampaigns[i].ext;
					break;
				}
			}
			//add EXTcampaignID to new Dataset
			for(var i=0;i<=extCampaigns.length-1;i++) {
				if(extCampaigns[i].name === data.campaign_name) {
					data.campaign_id = extCampaigns[i]._id;
					data.campaign_type = extCampaigns[i].type.charAt(0).toLowerCase();
					data.campaign_start = extCampaigns[i].start;
					data.campaign_end = extCampaigns[i].end;
					data.campaign_suffix = "e";
					break;
				}
			}
		} else {
			//empty rows - necessary for optimal presentation in export csv file
			data.intelliad_id = "";
			data.intelliad_root = "";
			data.intelliad_ext = "";
			//add INTcampaignID to new Dataset
			for(var i=0;i<=intCampaigns.length-1;i++) {
				if(intCampaigns[i].name === data.campaign_name) {
					data.campaign_id = intCampaigns[i]._id;
					data.campaign_type = intCampaigns[i].type.charAt(0).toLowerCase();
					data.campaigns_start = intCampaigns[i].start;
					data.campaign_end = intCampaigns[i].end;
					data.campaign_suffix = "i";
					break;
				}
			}
		}
		//add ChannelID to new Dataset
		for(var i=0;i<=creativeChannel.length-1;i++) {
			if(creativeChannel[i].channel === data.creative_channel) {
				data.creative_id = creativeChannel[i]._id;
				data.creative_channelid = creativeChannel[i].channelID;
			}
		}
		
		//generate CID 
		var domainToken = DATALAYER.cidConfig.domainToken;
		var organizationToken = DATALAYER.cidConfig.organizationToken;
		//if question mark does exist then add ampersand and concatenate
		var cid = data.campaign_type + "_" + domainToken + "_" + data.creative_channelid + data.campaign_suffix + "_" + organizationToken + "_" + data.campaign_id + "_" + data.adid + "_" + data.randomid;
		if(data.targeturl.indexOf("?") > -1) {
			var FQ = data.targeturl + "&" + cid;
		} else {
		//if no question mark in string then add ampersand + cid
			var FQ = data.targeturl + "?" + cid;
		}
		data.FQ = FQ;
		data.cid = cid;
		if(data.intelliad_id !== "") {
			data.intelliad_encoded = data.intelliad_root + encodeURIComponent(data.FQ) + data.intelliad_ext;
		} else {
			data.intelliad_encoded = "";
		}
		data.saintstatus = false;
		//time stamp of last modification
		data.modified = new Date().toISOString();
		
		return data;
	}
	
	return {
		createCID: createCID
	}
}])
.directive("cidModal",function() {
	return {
		restrict: "A",
		controller: "cidCtrl",
		require: "^^modalOnDemand",
		link: function(scope,element,attr,ctrl) {
			scope.hide = function() {
				ctrl.modalHideCtrl();
			}
		}
	}
});
//
//###CID-Logic Module###END
//

//
//###Worker Module###START
//
angular.module("pouchy.worker",["pouchy.errors"])
.service("$pouchyWorker",["$pouchyModelDatabase","$q","$pouchyError",function pouchyWorkerService($pouchyModelDatabase,$q,$pouchyError) {
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
		var doc;
		//if first parameter is a call to a database then assign the values to doc 
		//else take the data as an array - which is the alternative
		try {
			if(typeof(db) === "string") {
				doc = $pouchyModelDatabase.database[db];
			} else if(typeof(db) === "array") {
				doc = db;
			} else {
				throw new $pouchyError.FormatError("Only string or array accepted for worker");
			}
			var worker = new Worker("worker/datasetWorker.js");
			worker.addEventListener("message",function(e) {
				defer.resolve(e.data);
			},false);
			//var workerParameter = {doc:JSON.stringify(doc),fn:fn};
			var workerParameter = JSON.stringify(doc) + "UNIQUE_SEPERATOR" + fn;
			var ab = str2ab(workerParameter)
			worker.postMessage(ab);
				
			return defer.promise;
		}
		catch(e) {
			console.log(e.message);
		}
	}
	
	return {
		callWorker: serviceCaller
	}
}]);
//
//###Worker Module###END
//

//
//###Error Module###START
//
angular.module("pouchy.errors",[])
.factory("$pouchyError",function() {
	function FormatError(msg) {
		this.message = msg;
	}
	
	return {
		FormatError: FormatError
	}
});
//
//###Error Module###END
//