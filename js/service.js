var myServices = angular.module("myServices",[]);
myServices.service("$pouchDB",["$rootScope","$q",function($rootScope,$q) {
	var database;
	var changeListener;
	
	this.setDatabase = function(databaseName) {
		name = databaseName;
		database = new PouchDB(databaseName);
	}
	
	this.addDefer = function(doc) {
		var defer = $q.defer();
		database.put(doc).then(function() {
			defer.resolve(doc);
		},function() {
			defer.reject(doc);
		});
		return defer.promise;
	}
	
	this.startListening = function(dbName) {
		changeListener = database.changes({
			since: "now",
			live: true
		}).on("change", function(change) {
			if(!change.deleted) {
				$rootScope.$broadcast(dbName + ":change",change);
			} else {
				$rootScope.$broadcast(dbName + ":delete",change);
			}
		});
	}
	
	this.fetchAllDocs = function() {
		return database.allDocs({include_docs: true, descending: true});
	}
	
	this.deleteDoc = function(id,rev) {
		return database.remove(id,rev);
	}
}]);

myServices.factory("routeNavi",["$route","$location",function($route,$location) {
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
}]);