var myServices = angular.module("myServices",[]);
myServices.service("$pouchDB",["$rootScope","$q","msgBusService",function($rootScope,$q,msgBusService) {
	var database = {};
	var listening = [];
	var changeListener;
	
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
		if(listening.indexOf(val) > -1) return;
		listening.push(val);
		changeListener = database[val].changes({
			since: "now",
			live: true
		}).on("change", function(change) {
			if(!change.deleted) {
				msgBusService.emit(val + ":change",change);
			} else {
				msgBusService.emit(val + ":delete",change);
			}
		});
	}
	
	this.sync = function(db,remoteDatabase) {
        database[db].sync(remoteDatabase, {live: true, retry: true});
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

myServices.service("modalService",["$rootScope","$q","msgBusService",function($rootScope,$q,msgBusService) {
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
}]);

myServices.factory("msgBusService",["$rootScope",function($rootScope) {
	var msgBus = {};
	msgBus.emit = function(msg,data) {
		$rootScope.$emit(msg,data);
	};
	msgBus.get = function(msg,scope,func) {
		var unbind = $rootScope.$on(msg,func);
		scope.$on("$destroy",unbind);
	};
	return msgBus;
}]);

myServices.factory("hashService",function() {
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