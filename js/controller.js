app.controller("naviCtrl",["$scope","$location","$rootScope",function($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}]);

app.controller("mainCtrl",["$scope","$rootScope","$pouchDB","$location","dbService","msgBusService",function($scope,$rootScope,$pouchDB,$location,dbService,msgBusService) {
	var db;
	$scope.getdbName = function() {
		db = dbService.retrieve();
	};
	$scope.items = [];
	
	$scope.startListening = function() {
		$pouchDB.startListening(db);
	}
	
	$scope.addItem = function(data) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
			if(docs.rows.length !== 0) {
				return docs.rows[0].id;
			} else {
				return 0;
			}
		}).then(function(maxID){
			var mID = parseInt(maxID) + 1;
			data["_id"] = (mID).toString();
			return data;
		}).then(function(data) {
			$pouchDB.addDefer(db,data).then(function(doc) {
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
	$scope.fetchInitial = function() {
		$scope.fetchAll(db);
	}
	
	$scope.deleteItem = function(id,rev) {
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?")
		if(conf == true) $pouchDB.deleteDoc(db,id,rev);
	}
	
	//Global Listeners
	$rootScope.$on("db:change", function(event,data) {//db + ":change", function(event,data) {
		$scope.fetchAll(db);
	});
	
	$rootScope.$on("db:delete", function(event,data) {//db + ":delete", function(event,data) {
		$scope.$apply(function() {
			for(var i=0;i<=$scope.items.length-1;i++) {
				if($scope.items[i].id === data.id) {
					$scope.items.splice(i,1);
					break;
				}
			}
		});
	});
	
	//$scope.showModal = function(doc) {
	//	$rootScope.$broadcast("modal:toggle",doc);
	//};
	
	$scope.showModal = function(msg,data) {
		msgBusService.emit(msg,data);
		$scope.tempDocs = data;
	}
}]);