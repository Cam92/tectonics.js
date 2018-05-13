var JsonSerializer 	= {};
JsonSerializer.model = function (model, options) {
	options = options || {};
	var _random = options['random'] || new Random(model.seed);

	var world_json = JsonSerializer.world(model.world(), options);

	var model_json = {
		version: '2.0',
	    seed: model.seed,
		random: {
			mt: _random.mt,
			mti: _random.mti
		},
		age: model.age,
		world: world_json,
	};

	return model_json;
}
JsonSerializer.world = function (world, options) {
	options = options || {};

	var supercontinentCycle = world.lithosphere.supercontinentCycle;

	var world_json = {
		name: world.name,
		sealevel: world.hydrosphere.sealevel.value(),
		plates: [],
		grid: undefined,
		supercontinentCycle: {
			duration: supercontinentCycle.duration,
			age: supercontinentCycle.age,
		},
	};

	var plates = world.lithosphere.plates;
	for (var i = 0, li = plates.length; i < li; i++) {
		var plate = plates[i];
		var plate_json = JsonSerializer.plate(plate, options);
		world_json.plates.push(plate_json);
	};
	return world_json;
}
JsonSerializer.plate = function (plate, options) {
	options = options || {};
	
	// serialize non-field values to json
	var plate_json = {
		mask: Base64.encode(plate.mask.buffer),
		crust: Base64.encode(plate.crust.buffer),
		local_to_global_matrix: Base64.encode(plate.local_to_global_matrix.buffer),
	};

	return plate_json;
}

var JsonDeserializer = {};
JsonDeserializer.plate = function (plate_json, world, options) {
	options = options || {};

	var plate = new Plate({
		grid: world.grid,
		world: world,
		local_to_global_matrix: new Float32Array(Base64.decode(plate_json.local_to_global_matrix)),
		mask: Uint8Raster.FromBuffer(Base64.decode(plate_json.mask), world.grid),
		crust: new Crust({
			grid: world.grid, 
			buffer: Base64.decode(plate_json.crust)
		})
	});

	return plate;
}
JsonDeserializer.world = function (world_json, grid, options) {
	options = options || {};

	var world = new World(
	{
		name: world_json.name,
		sealevel: world_json.sealevel,
		grid: grid,
		supercontinentCycle: undefined,
	});

	world.lithosphere.plates = world_json.plates.map(plate_json => JsonDeserializer.plate(plate_json, world, options))
	world.lithosphere.supercontinentCycle = new SupercontinentCycle(world.lithosphere, world_json.supercontinentCycle);

	return world;
}
JsonDeserializer.model = function (model_json, grid, options) {
	options = options || {};

	var _model = new Model({
		seed: 	model_json.seed,
		world: 	JsonDeserializer.world(model_json.world, grid, options),
		age: 	model_json.age,
	});

	var _random = new Random(model_json.seed);
	_random.mt  = model_json.random.mt;
	_random.mti  = model_json.random.mti;
	return {
		model: _model,
		random: _random
	};
}