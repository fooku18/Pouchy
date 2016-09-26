app.controller("naviCtrl",["$scope","$location","$rootScope",function($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}]);

app.controller("mainCtrl",["$scope","$rootScope","$pouchDB","$location","msgBusService","$attrs","docShareService",function($scope,$rootScope,$pouchDB,$location,msgBusService,$attrs,docShareService) {
	var db = $attrs.db;
	$scope.items = [];
	
	$scope.startListening = function() {
		$pouchDB.startListening(db);
	}
	
	$scope.addItem = function(data) {
		if(!data["_id"]) data["_id"] = new Date().toISOString();
		$pouchDB.addDefer(db,data).then(function(doc) {
			$(".inputField").each(function() {
				$(this).val("");
			});
			console.log(doc._id + " created!");
		});
	};
	
	
	$scope.keyHit = function() {
		//$scope.addItem();
	}
	
	$scope.fetchAll = function(db) {
		$pouchDB.fetchAllDocs(db).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			};
		}).then(function() {
			console.log($scope.items);
			$scope.$apply();
		});
	}
	
	$scope.fetchInitial = function() {
		$scope.fetchAll(db);
		var listeners = $pouchDB.getModuleListeners();
		console.log(listeners.indexOf(db));
		if(listeners.indexOf(db) < 0) {
			console.log("DRIN");
			$pouchDB.setModuleListeners(db);
			msgBusService.get("db:change",$scope,
				function(event,data) {
					console.log(db);
					$scope.fetchAll(db);
				}
			);
			msgBusService.get("db:delete",$scope,
				function(event,data) {
					$scope.$apply(function() {
						for(var i=0;i<=$scope.items.length-1;i++) {
							if($scope.items[i].id === data.id) {
								$scope.items.splice(i,1);
								break;
							}
						}
					});
				}
			);
			if(db === "cid_DB") {
				msgBusService.get("modal:dbAdd",$scope,
					function(event,data) {
						$scope.addItem(data);
					}
				);
			}
		}
	}
	
	$scope.deleteItem = function(id,rev) {
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?");
		if(conf == true) $pouchDB.deleteDoc(db,id,rev);
	}
	
	$scope.showModal = function(data) {
		docShareService.setValues(data);
		msgBusService.emit("modal:toggle");
	}
	
	//initialize
	$scope.startListening();
	$scope.fetchInitial();
}]);

app.controller("modalCtrl",["$scope","docShareService","msgBusService","$pouchDB",function($scope,docShareService,msgBusService,$pouchDB) {
	$scope.intelliAdCampaigns = [];
	msgBusService.get("modal:toggle",$scope,
		function(event,data) {
			$pouchDB.fetchAllDocs("intelliAd_DB").then(function(data) {
				if($scope.intelliAdCampaigns.length === 0) {
					for(var i=0;i<=data.rows.length-1;i++) {
						($scope.intelliAdCampaigns).push({'name':data.rows[i].doc.name,'root':data.rows[i].doc.root,'ext':data.rows[i].ext});
					};
				}
				$scope.values = docShareService.getValues();
				$scope.$digest();
			})
		}
	)
	
	$scope.isActive = function(val) {
		if(val === "Extern") {
			return true;
		} else {
			return false;
		}
	}
	
	$scope.addToDB = function(data) {
		var inputData = $scope.doCIDLogic(data);
		msgBusService.emit("modal:dbAdd",data);
	}
	
	//CID Generating Logic
	$scope.doCIDLogic = function(data) {
		if(typeof(data.extcampaigns) !== "undefined") {
			for(var i=0;i<=$scope.intelliAdCampaigns.length-1;i++) {
				if($scope.intelliAdCampaigns[i].name === data.extcampaigns) {
					data.root = $scope.intelliAdCampaigns[i].root;
					data.ext = $scope.intelliAdCampaigns[i].ext;
					break;
				}
			}
		}
		
		
	}
}]);