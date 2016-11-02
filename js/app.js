var app = (function() {
	var app = angular.module("myApp",["pouchy.pouchDB","pouchy.cidLogic","ngRoute","pouchy.navigation","pouchy.modal","pouchy.pagination","pouchy.import_export","pouchy.multiPurpose","pouchy.worker","pouchy.model","ngAnimate"])//;
	app.run(["$pouchDB","DATALAYER","$pouchyModel",function($pouchDB,DATALAYER,$pouchyModel) {
		var _global = DATALAYER;
		for(var i=0;i<=_global.databaseConfig.databases.length-1;i++) {
			$pouchyModel.initDatabase(_global.databaseConfig.databases[i]);
		}
		$("document").ready(function() {
			setTimeout(function() {
				$("body").toggleClass("loaded");
			},2000);
		});
	}]).config(["$routeProvider","DATALAYER",function($routeProvider,DATALAYER) {
		var exec = (function() {
			var tmp = "$routeProvider";
			for(var i=0;i<=DATALAYER.routingConfig.htmlPath.length-1;i++) {
				tmp += ".when('" + DATALAYER.routingConfig.hashTag[i] + "',{templateUrl:'" + DATALAYER.routingConfig.htmlPath[i] + "',name:'" + DATALAYER.routingConfig.pageNames[i] + "'})"
			}
			return tmp += ".otherwise({redirect:'/'});";
		}());
		eval(exec);
	}]);

	return app;
}());