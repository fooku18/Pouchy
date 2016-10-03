app.controller("naviCtrl",["$scope","$location","$rootScope",function($scope,$location,$rootScope) {
	$scope.isActive = function(viewLocation) {
		return viewLocation === $location.path();
	}
	$scope.setTitle = function(title) {
		$rootScope.$broadcast("$location:change",title);
	}
}]);

app.controller("modalDelegatorCtrl",["$scope","$rootScope","modalService",function($scope,$rootScope,modalService) {
	$scope.$on("modal:initService",function(event,data) {
		modalService.open(data).then(function() {
			console.log("resolved");
		},function() {
			console.log("rejected");
		});
	});
	$scope.open = function() {
		
	}
}]);

app.controller("mainCtrl",["$scope","$rootScope","$pouchDB","hashService","msgBusService","$attrs","docShareService",function($scope,$rootScope,$pouchDB,hashService,msgBusService,$attrs,docShareService) {
	var db = $attrs.db;
	$scope.items = [];
	
	$scope.startListening = function(val) {
		$pouchDB.startListening(val);
	}
	
	$scope.addItem = function(data) {
		if($scope.userForm.$valid) {
			if(!data["_id"]) data["_id"] = new Date().toISOString();
			if(db === "campaigns_DB") {
				data["campid"] = hashService.hash(data["_id"]).toString();
			}
			$pouchDB.addDefer(db,data).then(function(doc) {
				$(".inputField").each(function() {
					//$(this).val("");
					$scope.c = {};
				});
				console.log(doc._id + " created!");
			});
		} else {
			//$scope.$emit("modal:initService","invalid");
			
		}
	};
	
	$scope.fetchAll = function(val) {
		$pouchDB.fetchAllDocs(val).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			};
		}).then(function() {
			$scope.$apply();
		});
	}
	
	$scope.fetchInitial = function() {
		$scope.fetchAll(db);
		msgBusService.get(db + ":change",$scope,
			function(event,data) {
				$scope.fetchAll(db);
			}
		);
		msgBusService.get(db + ":delete",$scope,
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
	
	$scope.deleteItem = function(id,rev) {
		var conf = confirm("Sind Sie sicher das Sie den Eintrag löschen möchten?");
		if(conf == true) $pouchDB.deleteDoc(db,id,rev);
	}
	
	$scope.showModal = function(data) {
		docShareService.setValues(data);
		msgBusService.emit("modal:toggle");
	}
	
	//initialize
	$scope.startListening(db);
	$scope.fetchInitial();
}]);

app.controller("modalCtrl",["$scope","docShareService","msgBusService","$pouchDB",function($scope,docShareService,msgBusService,$pouchDB) {
	$scope.values = {
		'intext': "",
		'extcampaign': "",
		'extintellicampaign': "",
		'intcampaign': "",
		'targeturl': "",
		'ad': "",
		'placement': "",
		'adtype': "",
		'creativeChannel': "",
		'adid': "",
		'randomid': ""
	};
	console.log($scope.values);
	$scope.intelliAdCampaigns = [];
	$scope.extCampaigns = [];
	$scope.intCampaigns = [];
	$scope.creativeChannel = [];
	msgBusService.get("modal:toggle",$scope,
		function(event) {
			if($scope.visited != 1) {
				$pouchDB.fetchAllDocs("intelliAd_DB").then(function(data) {
					for(var i=0;i<=data.rows.length-1;i++) {
						($scope.intelliAdCampaigns).push({'name':data.rows[i].doc.name,'root':data.rows[i].doc.root,'ext':data.rows[i].ext});
					};
				}).then(function() {
					return $pouchDB.fetchAllDocs("campaigns_DB");
				}).then(function(data) {
					for(var i=0;i<=data.rows.length-1;i++) {
						if(data.rows[i].doc.intext === "Extern") {
							($scope.extCampaigns).push({'name':data.rows[i].doc.name});
						} else {
							($scope.intCampaigns).push({'name':data.rows[i].doc.name});
						}
					}
				}).then(function() {
					return $pouchDB.fetchAllDocs("channelID_DB");
				}).then(function(data) {
					for(var i=0;i<=data.rows.length-1;i++) {
						($scope.creativeChannel).push({'channelID':data.rows[i].doc.channelID,'channel':data.rows[i].doc.channel});
					}
					$scope.values = docShareService.getValues();
					$scope.visited = 1;
					$scope.$digest();
				});
			}
		}
	);
	
	$scope.isActive = function(val) {
		if(val === "Extern") {
			return true;
		} else {
			return false;
		}
	}
	
	$scope.addToDB = function(data) {
		$scope.doCIDLogic(data);
		//msgBusService.emit("modal:dbAdd",data);
	}
	
	//CID Generating Logic
	$scope.doCIDLogic = function(data) {
		console.log(data);
		if(typeof(data.extcampaign) !== "undefined") {
			for(var i=0;i<=$scope.intelliAdCampaigns.length-1;i++) {
				if($scope.intelliAdCampaigns[i].name === data.extcampaign) {
					data.root = $scope.intelliAdCampaigns[i].root;
					data.ext = $scope.intelliAdCampaigns[i].ext;
					break;
				}
			}
		}
		for(var i=0;i<=$scope.creativeChannel.length-1;i++) {
			if($scope.creativeChannel[i].channel === data.creativechannel) {
				data.channelID = $scope.creativeChannel[i].channelID;
			}
		}
		
		
	}
}]);