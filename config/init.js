(function() {
	var xhr = new XMLHttpRequest();
	var data = document.getElementById("dataConfig");
	xhr.open("GET","config/config.json",false);
	xhr.send(null);
	data.textContent = xhr.responseText;
})();