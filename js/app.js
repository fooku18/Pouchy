var app = (function() {
	var app = angular.module("myApp",["pouchy.pouchDB","pouchy.pageLogic","ngRoute","pouchy.navigation","pouchy.clipboard","pouchy.modal","pouchy.pagination","pouchy.import_export","pouchy.multiPurpose","pouchy.news"])//;
	app.run(["$pouchDB","DATALAYER",function($pouchDB,DATALAYER) {
		var _global = DATALAYER;
		for(var i=0;i<=_global.databaseConfig.databases.length-1;i++) {
			$pouchDB.setDatabase(_global.databaseConfig.databases[i]);
		}
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