self.addEventListener("message",function(e) {
	var doc = JSON.parse(e.data.doc);
	eval("var fn = " + e.data.fn);
	var result = fn(doc);
	self.postMessage(result);
},false);