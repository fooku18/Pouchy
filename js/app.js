var app = angular.module("myApp",["myServices","ngRoute"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("campaigns_DB");
	$pouchDB.setDatabase("intelliAd_DB");
	$pouchDB.setDatabase("cid_DB");
}]).config(["$routeProvider",function($routeProvider) {
	$routeProvider.when("/", {
		templateUrl: "templates/kampagnen.html",
		name: "Kampagnen-Konfiguration"
	}).when("/IntelliAd", {
		templateUrl: "templates/intelliad.html",
		name: "IntelliAd-Konfiguration"
	}).when("/create", {
		templateUrl: "templates/create.html",
		name: "ID Erstellen"
	}).otherwise({
		redirect: "/"
	});
}]);
