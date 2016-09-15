var myServices = angular.module("myServices",[]);
myServices.service("$pouchDB",["$rootScope","$q",function($rootScope,$q) {
	var database;
	var changeListener;
	
	this.setDatabase = function(databaseName) {
		database = new PouchDB(databaseName);
	}
	
	this.addDefer = function(doc) {
		var defer = $q.defer();
		database.put({
			"_id": new Date().toISOString(),
			"name": doc
		}).then(function() {
			defer.resolve(doc);
		},function() {
			defer.reject(doc);
		});
		return defer.promise;
	}
	
	this.startListening = function() {
		changeListener = database.changes({
			live: true,
			include_docs: true
		}).on("change"), function(change) {
			/*if(!change.deleted) {
				$rootScope.$broadcast("$pouchDB:change",change);
			} else {
				$rootScope.$broadcast("$pouchDB:delete",change);
			}*/
			console.log(change);
		}
	}
	
	//this.stopListening = function() {
	//	changeListener.cancel();
	//}
	
	//this.save = function(doc) {
	//	var deferred = $q.defer();
	//	
	//}
	
}]);
