//buffer to string converter
function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}	
self.addEventListener("message",function(e) {
	//we parse the transmitted arraybuffer back to a string and format it sufficiently so that we can 
	//execute our desired function
	var str = ab2str(e.data);
	var splitter = str.split("UNIQUE_SEPERATOR");
	//the string contained a special UNIQUE_SEPERATOR so that we can seperate the object from the function
	var doc = splitter[0];
	var fn = splitter[1];
	//parse the string pieces to appropriate representation and execute the function
	var docObj = JSON.parse(doc);
	eval("var Fn = " + fn);
	var result = Fn(docObj);
	//the result is piped back to our main thread - worker finished
	self.postMessage(result);
},false);