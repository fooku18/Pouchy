var app = angular.module("myApp",["myServices","ngRoute"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("campaigns_DB");
	$pouchDB.setDatabase("intelliAd_DB");
	$pouchDB.setDatabase("cid_DB");
	$pouchDB.setDatabase("channelID_DB");
	//$pouchDB.sync("campaigns_DB","http://localhost:5984/campaigns_db");
	//$pouchDB.sync("intelliAd_DB","http://localhost:5984/intelliad_db");
	//$pouchDB.sync("cid_DB","http://localhost:5984/cid_db");
	//$pouchDB.sync("channelID_DB","http://localhost:5984/channelid_db");
}]).config(["$routeProvider",function($routeProvider) {
	$routeProvider.when("/", {
		templateUrl: "templates/kampagnen.html",
		name: "Kampagnen-Konfiguration"
	}).when("/IntelliAd", {
		templateUrl: "templates/intelliad.html",
		name: "IntelliAd-Konfiguration"
	}).when("/channelID", {
		templateUrl: "templates/channelID.html",
		name: "ChannelID-Konfiguration"
	}).when("/create", {
		templateUrl: "templates/create.html",
		name: "ID Erstellen"
	}).otherwise({
		redirect: "/"
	});
}]);
