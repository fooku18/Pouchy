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

app.controller("pouchyCtrl",["$scope","$rootScope","$pouchDB","$location",function($scope,$rootScope,$pouchDB,$location) {
	$scope.items = [];
	
	$pouchDB.startListening();
	
	$scope.addItem = function(cName,cType,cStart,cEnd) {
		$pouchDB.fetchAllDocs().then(function(docs) {
			console.log(docs.rows.length);
			if(docs.rows.length !== 0) {
				return docs.rows[0].id;
			} else {
				return 0;
			}
		}).then(function(maxID){
			var mID = parseInt(maxID) + 1;
			var entry = {
				"_id": (mID).toString(),
				"name": cName,
				"type": cType,
				"start": cStart,
				"end": cEnd
			}
			return entry;
		}).then(function(entry) {
			$pouchDB.addDefer(entry).then(function(doc) {
				$("#inputField").val("");
				console.log(doc.name + " created!");
			});
		});
	}
	
	$scope.keyHit = function(keyHit,name) {
		if(keyHit.keyCode === 13) $scope.addItem(name);
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
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?")
		if(conf == true) $pouchDB.deleteDoc(id,rev);
	}
	
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
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
