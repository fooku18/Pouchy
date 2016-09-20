var myServices = angular.module("myServices",[]);
myServices.service("$pouchDB",["$rootScope","$q",function($rootScope,$q) {
	var database = {};
	var changeListener;
	
	this.setDatabase = function(databaseName) {
		database[databaseName] = new PouchDB(databaseName);
	}
	
	this.addDefer = function(db,doc) {
		var defer = $q.defer();
		database[db].put(doc).then(function() {
			defer.resolve(doc);
		},function() {
			defer.reject(doc);
		});
		return defer.promise;
	}
	
	this.startListening = function(db) {
		changeListener = database[db].changes({
			since: "now",
			live: true
		}).on("change", function(change) {
			if(!change.deleted) {
				$rootScope.$broadcast(db + ":change",change);
			} else {
				$rootScope.$broadcast(db + ":delete",change);
			}
		});
	}
	
	this.fetchAllDocs = function(db) {
		return database[db].allDocs({include_docs: true, descending: true});
	}
	
	this.deleteDoc = function(db,id,rev) {
		return database[db].remove(id,rev);
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