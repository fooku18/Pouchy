app.controller("mainCtrl",["$scope","$rootScope","$pouchDB","hashService","msgBusService","$attrs","docShareService","modalService",function($scope,$rootScope,$pouchDB,hashService,msgBusService,$attrs,docShareService,modalService) {
	var db = $attrs.db;
	$scope.items = [];
	
	$scope.startListening = function(val) {
		$pouchDB.startListening(val);
	}
	
	$scope.validation = function(val,data) {
		if(val) {
			$scope.addItem(data);
			modalService.open({template:"success",barColor:"green"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		} else {
			modalService.open({template:"invalid",barColor:"red"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		}
	}
	
	$scope.addItem = function(data) {
		if(!data["_id"] || data["_id"] === "") data["_id"] = new Date().toISOString();
		if(db === "campaigns_db") {
			data["campid"] = hashService.hash(data["_id"]).toString();
		}
		$pouchDB.addItem(db,data).then(function(doc) {
			if($scope.userForm) {
				$scope.c = {};
				$scope.userForm.$setPristine();
			}
			console.log(doc._id + " created!");
		});
	};
	
	$scope.fetchAll = function(val) {
		$pouchDB.fetchAllDocs(val).then(function(docs) {
			$scope.items = [];
			for(var i=0;i<=docs.rows.length-1;i++) {
				($scope.items).push(docs.rows[i]);
			}
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
	}
	
	$scope.deleteItem = function(doc) {
		modalService.open({template:"delete",barColor:"red",data:doc.info}).then(function() {
			$pouchDB.deleteDoc(db,doc.id,doc.rev);
			console.log(doc.id + " deleted");
		},function() {
			console.log("Aborted");
		});
	}
	
	$scope.showModal = function(data) {
		modalService.open({template:"create",barColor:"blue",data:data}).then(function(data) {
			$scope.addItem(data);
			console.log("resolved");
		}, function() {
			console.log("rejected");
		});
	}
	
	//initialize
	$scope.startListening(db);
	$scope.fetchInitial();
}]);

app.controller("cidCtrl",["$scope","$rootScope","docShareService","msgBusService","$pouchDB","modalService",function($scope,$rootScope,docShareService,msgBusService,$pouchDB,modalService) {
	$scope.intelliAdCampaigns = [];
	$scope.extCampaigns = [];
	$scope.intCampaigns = [];
	$scope.creativeChannel = [];
	
	$scope.checkWID = function(value,intext) {
		var campaign;
		(intext === "extern") ? campaign = "extcampaign" : campaign = "intcampaign";
		$pouchDB.fetchAllDocs("cid_db")
			.then(function(data) {
				var counter = 0;
				for(var i = 0; i<=data.rows.length-1;i++) {
					if(data.rows[i].doc[campaign] === value) {
						counter++;
					}
				}
				counter++;
				var counterLength = counter.toString().length;
				var wid = Array(6-counterLength).join("0") + counter.toString();
				$scope.values.adid = wid;
			});
	};
	
	//fetch other db information
	(function() {$pouchDB.fetchAllDocs("intelliad_db").
		then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				($scope.intelliAdCampaigns).push({
					'name':data.rows[i].doc.name,
					'root':data.rows[i].doc.root,
					'ext':data.rows[i].doc.ext
				});
			};
		}).then(function() {
			return $pouchDB.fetchAllDocs("campaigns_db");
		}).then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				if(data.rows[i].doc.intext === "Extern") {
					($scope.extCampaigns).push(data.rows[i].doc);
				} else {
					($scope.intCampaigns).push(data.rows[i].doc);
				}
			}
		}).then(function() {
			return $pouchDB.fetchAllDocs("channelid_db");
		}).then(function(data) {
			for(var i=0;i<=data.rows.length-1;i++) {
				($scope.creativeChannel).push(data.rows[i].doc);
			}
		});
	}())

	$scope.isActive = function(val) {
		if(val === "Extern") {
			$scope.values.intcampaign = "";
			return true;
		} else {
			$scope.values.extcampaign = "";
			$scope.values.extintellicampaign = "";
			return false;
		}
	}
	
	$scope.validation = function(val,data) {
		if(val) {
			$scope.addToDB(data);
		} else {
			modalService.open({template:"invalid",barColor:"green"}).
			then(function() {
				console.log("resolved");
			},function() {
				console.log("rejected");
			});
		}
	}
	
	$scope.addToDB = function(data) {
		addedData = $scope.doCIDLogic(data);
		modalService.resolve(data);
		$scope.modalHide();
	}
	
	//CID generating logic
	$scope.doCIDLogic = function(data) {
		if(typeof(data.extcampaign) !== "undefined" && data.extcampaign !== "") {
			//add intelliadCamp to new Dataset
			for(var i=0;i<=$scope.intelliAdCampaigns.length-1;i++) {
				if($scope.intelliAdCampaigns[i].name === data.extintellicampaign) {
					data.root = $scope.intelliAdCampaigns[i].root;
					data.ext = $scope.intelliAdCampaigns[i].ext;
					break;
				}
			}
			//add EXTcampaignID to new Dataset
			for(var i=0;i<=$scope.extCampaigns.length-1;i++) {
				if($scope.extCampaigns[i].name === data.extcampaign) {
					data.campaignID = $scope.extCampaigns[i].campid;
					data.campaignType = $scope.extCampaigns[i].type.charAt(0).toLowerCase();
					data.campaignStart = $scope.extCampaigns[i].start;
					data.campaignEnd = $scope.extCampaigns[i].end;
					data.campaignIntExtSuffix = "e";
					break;
				}
			}
		} else {
			//add INTcampaignID to new Dataset
			for(var i=0;i<=$scope.intCampaigns.length-1;i++) {
				if($scope.intCampaigns[i].name === data.intcampaign) {
					data.campaignID = $scope.intCampaigns[i].campid;
					data.campaignType = $scope.intCampaigns[i].type.charAt(0).toLowerCase();
					data.campaignStart = $scope.intCampaigns[i].start;
					data.campaignEnd = $scope.intCampaigns[i].end;
					data.campaignIntExtSuffix = "i";
					break;
				}
			}
		}
		//add ChannelID to new Dataset
		for(var i=0;i<=$scope.creativeChannel.length-1;i++) {
			if($scope.creativeChannel[i].channel === data.creativechannel) {
				data.channelID = $scope.creativeChannel[i].channelID;
				data.channel = $scope.creativeChannel[i].channel;
			}
		}
		
		//generate CID 
		//get globals
		var globals = JSON.parse(document.getElementById("dataConfig").textContent);
		var domainToken = globals.cidConfig.domainToken;
		var organizationToken = globals.cidConfig.organizationToken;
		//if question mark exists then add ampersand and concatenate
		var cid = data.campaignType + "_" + domainToken + "_" + data.channelID + data.campaignIntExtSuffix + "_" + organizationToken + "_" + data.campaignID + "_" + data.adid + "_" + data.randomid;
		if(data.targeturl.indexOf("?") > -1) {
			var FQ = data.targeturl + "&" + cid;
		} else {
		//if no question mark in string then add ampersand + cid
			var FQ = data.targeturl + "?" + cid;
		}
		data.FQ = FQ;
		data.cid = cid;
		
		return data;
	}
}]);