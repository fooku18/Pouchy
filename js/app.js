var app = angular.module("myApp",["myServices"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("localDB");
}]);
app.controller("pouchyCtrl",["$scope","$rootScope","$pouchDB",function($scope,$rootScope,$pouchDB) {
	$scope.items = {};
	
	$pouchDB.startListening();
	
	$scope.addItem = function() {
		$pouchDB.addDefer($scope.doc).then(function(doc) {
			alert(doc + " created!");
		});
	}
	
	//Global Listeners
	//$rootScope.$on("$pouchDB:change", function(event,data) {
	//	console.log(data);
	//});
}]);
