app.controller("naviCtrl",["$scope","$location","$rootScope",function($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}]);

app.controller("campaignCtrl",["$scope","$rootScope","$pouchDB","$location",function($scope,$rootScope,$pouchDB,$location) {
	var db = "campaigns_DB";
	$scope.items = [];
	$scope.cType = "Conversion";
	$pouchDB.startListening(db);
	
	$scope.addItem = function(cName,cType,cStart,cEnd) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
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
			$pouchDB.addDefer(db,entry).then(function(doc) {
				$("#inputField").val("");
				console.log(doc.name + " created!");
			});
		});
	}
	
	$scope.keyHit = function() {
		$scope.addItem($scope.cName,$scope.cType,$scope.cStart,$scope.cEnd);
	}
	
	$scope.fetchAll = function(db) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			};
		}).then(function() {;
			$scope.$apply();
		});
	}
	$scope.fetchAll(db);
	
	$scope.deleteItem = function(id,rev) {
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?")
		if(conf == true) $pouchDB.deleteDoc(db,id,rev);
	}
	
	//Global Listeners
	$rootScope.$on(db + ":change", function(event,data) {
		$scope.fetchAll(db);
	});
	
	$rootScope.$on(db + ":delete", function(event,data) {
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


app.controller("intelliAdCtrl",["$scope","$rootScope","$pouchDB","$location",function($scope,$rootScope,$pouchDB,$location) {
	var db = "intelliAd_DB";
	$scope.items = [];
	$pouchDB.startListening(db);
	
	$scope.addItem = function(cName,cRoot,cExt) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
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
				"root": cRoot,
				"ext": cExt
			}
			return entry;
		}).then(function(entry) {
			$pouchDB.addDefer(db,entry).then(function(doc) {
				$("#inputField").val("");
				console.log(doc.name + " created!");
			});
		});
	}
	
	$scope.keyHit = function() {
		$scope.addItem($scope.cName,$scope.cRoot,$scope.cExt);
	}
	
	$scope.fetchAll = function(db) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			};
		}).then(function() {;
			$scope.$apply();
		});
	}
	$scope.fetchAll(db);
	
	$scope.deleteItem = function(id,rev) {
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?")
		if(conf == true) $pouchDB.deleteDoc(db,id,rev);
	}
	
	//Global Listeners
	$rootScope.$on(db + ":change", function(event,data) {
		$scope.fetchAll(db);
	});
	
	$rootScope.$on(db + ":delete", function(event,data) {
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

app.controller("createCtrl",["$scope","$rootScope",function($scope,$rootScope) {
	
}]);