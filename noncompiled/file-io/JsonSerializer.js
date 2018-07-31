var JsonSerializer 	= {};
JsonSerializer.sim = function (sim) {

	var replacer = function(key, value) {
		if (value !== void 0 && value.constructor === ArrayBuffer) {
			return 'buffer:' + Base64.encode(value);
		}
		return value;
	}

	return JSON.stringify(sim.getParameters(), replacer);
}
var JsonDeserializer = {};
JsonDeserializer.sim = function (json, sim) {

	var reviver = function(key, value) {
		if (typeof value === 'string' && value.startsWith('buffer:')) {
			return Base64.decode(value.substr('buffer:'.length));
		}
		return value;
	}

	return new Simulation(JSON.parse(json, reviver));
}
