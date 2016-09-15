var app = angular.module("myApp",["myServices"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("localDB");
}]);
app.controller("pouchyCtrl",["$scope","$rootScope","$pouchDB",function($scope,$rootScope,$pouchDB) {
	$scope.items = [];
	
	$pouchDB.startListening();
	
	$scope.addItem = function() {
		$pouchDB.addDefer($scope.doc).then(function(doc) {
			console.log(doc + " created!");
		});
	}
	
	$scope.fetchAll = function() {
		$pouchDB.fetchAllDocs().then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i].doc.name);
			};
		}).then(function() {;
			$scope.$apply();
		});
	}
	
	//Global Listeners
	$rootScope.$on("$pouchDB:change", function(event,data) {
		$scope.fetchAll();
	});
}]);
