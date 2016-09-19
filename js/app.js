var app = angular.module("myApp",["myServices","ngRoute"]);
app.run(["$pouchDB",function($pouchDB) {
	$pouchDB.setDatabase("localDB");
}]).config(["$routeProvider",function($routeProvider) {
	$routeProvider.when("/", {
		templateUrl: "templates/kampagnen.html",
		name: "Kampagnen"
	}).when("/create", {
		templateUrl: "templates/create.html",
		name: "Erstellung"
	}).when("/upload", {
		templateUrl: "templates/upload.html",
		name: "Upload"
	}).when("/IntelliAd", {
		templateUrl: "templates/intelliad.html",
		name: "IntelliAd-Konfiguration"
	});
}]);
