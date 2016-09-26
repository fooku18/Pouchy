var myServices = angular.module("myServices",[]);
myServices.service("$pouchDB",["$rootScope","$q","msgBusService",function($rootScope,$q,msgBusService) {
	var database = {};
	var listening = [];
	var moduleListeners = [];
	var changeListener;
	
	this.getDatabases = function(dbName) {
		return database[dbName];
	}
	
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
		if(listening.indexOf(db) > -1) return;
		listening.push(db);
		changeListener = database[db].changes({
			since: "now",
			live: true
		}).on("change", function(change) {
			if(!change.deleted) {
				msgBusService.emit("db:change",change);
			} else {
				msgBusService.emit("db:delete",change);
			}
		});
	}
	
	this.sync = function(db,remoteDatabase) {
        database[db].sync(remoteDatabase, {live: true, retry: true});
    }
	
	this.fetchAllDocs = function(db) {
		return database[db].allDocs({include_docs: true, descending: true});
	}
	
	this.deleteDoc = function(db,id,rev) {
		return database[db].remove(id,rev);
	}
	
	this.setModuleListeners = function(val) {
		moduleListeners.push(val);
	}
	
	this.getModuleListeners = function() {
		return moduleListeners;
	}
}]);

myServices.service("docShareService",function() {
	var values = {};
	this.setValues = function(val) {
		values = val;
	}
	this.getValues = function() {
		return values;
	}
});

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

myServices.factory("msgBusService",["$rootScope",function($rootScope) {
	var msgBus = {};
	msgBus.emit = function(msg,data) {
		$rootScope.$emit(msg,data);
	};
	msgBus.get = function(msg,scope,func) {
		var unbind = $rootScope.$on(msg,func);
		scope.$on("$destory",unbind);
	};
	return msgBus;
}]);