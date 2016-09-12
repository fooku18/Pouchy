var services = angular.module("myServices",[]);
services.service("$pouchDB",["$rootScope","$q",function($rootScope,$q) {
	var database;
	var changeListener;
	
	this.setDatabase = function(databaseName) {
		database = new PouchDB(databaseName);
	}
	
	this.startListening = function() {
		changeListener = database.changes({
			live: true,
			include_docs: true
		}).on("change"), function(change) {
			if(!change.deleted) {
				$rootScope.$broadcast("$pouchDB:change",change);
			} else {
				$rootScope.$broadcast("$pouchDB:delete",change);
			}
		}
	}
	
}]);
