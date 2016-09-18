var app = angular.module("myApp",["myServices","ngRoute"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("localDB");
}]).config(["$routeProvider",function($routeProvider) {
	$routeProvider.when("/", {
		templateUrl: "templates/kampagnen.html",
		name: "Kampagnen"
	}).when("/config", {
		templateUrl: "templates/konfiguration.html",
		name: "Konfiguration"
	});
}]);

app.controller("pouchyCtrl",["$scope","$rootScope","$pouchDB",function($scope,$rootScope,$pouchDB) {
	$scope.items = [];
	
	$pouchDB.startListening();
	
	$scope.addItem = function(name) {
		console.log(name);
		var entry = {
			"_id": new Date().toISOString(),
			"name": name
		}
		$pouchDB.addDefer(entry).then(function(doc) {
			$("#inputField").val("");
			console.log(doc.name + " created!");
		});
	}
	
	$scope.keyHit = function(keyHit) {
		if(keyHit.keyCode === 13) $scope.addItem($scope.name);
	}
	
	$scope.fetchAll = function() {
		$pouchDB.fetchAllDocs().then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			};
		}).then(function() {;
			$scope.$apply();
		});
	}
	$scope.fetchAll();
	
	$scope.deleteItem = function(id,rev) {
		$pouchDB.deleteDoc(id,rev);
	}
	
	//Global Listeners
	$rootScope.$on("$pouchDB:change", function(event,data) {
		$scope.fetchAll();
	});
	
	$rootScope.$on("$pouchDB:delete", function(event,data) {
		$scope.$apply(function() {
			for(var i=0;i<=$scope.items.length-1;i++) {
				if($scope.items[i].id === data.id) {
					$scope.items.splice(i,1);
					break;
				}
			}
		});
	});
}]);
