'use strict';

var scalarDisplays = {};


function ScalarDisplay(options) {
	var color = options['color'] || 0x000000;
	var min = options['min'] || '0.';
	var max = options['max'] || '1.';
	var scalar = options['scalar'] || 'vScalar';
	this.getField = options['getField'];
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 uncovered 		= @UNCOVERED;
			vec4 ocean 			= mix(OCEAN, uncovered, 0.5);
			vec4 sea_covered 	= vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			gl_FragColor = sea_covered;
			**/}))
		.replace('@UNCOVERED', 'mix( vec4(1), vec4(color,1.), smoothstep(@MIN, @MAX, @SCALAR) )')
		.replace('@MIN', min)
		.replace('@MAX', max)
		.replace('@SCALAR', scalar);
	this._color = new THREE.Color(color);
}
ScalarDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;

	mesh.material.uniforms.color.value = this._color;
	mesh.material.uniforms.color.needsUpdate = true;
};
ScalarDisplay.prototype.removeFrom = function(mesh) {
	
};
ScalarDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	scalar = geometry.attributes.scalar.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var scalar_model = this.getField !== void 0? this.getField(plate) : void 0;
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
		if (scalar_model !== void 0) {
			scalar[j] = is_member * scalar_model[buffer_array_index]; 
		}
	}
	geometry.attributes.displacement.needsUpdate = true;
	if (scalar_model !== void 0) {
		geometry.attributes.scalar.needsUpdate = true;
	}
}
scalarDisplays.npp 	= new ScalarDisplay( {color: 0x00ff00, scalar: 'npp'} );
scalarDisplays.alt 	= new ScalarDisplay( {color: 0x000000, min:'sealevel', max:'maxheight', scalar: 'alt'} );


function ScalarHeatDisplay(options) {
	var min = options['min'] || '0.';
	var max = options['max'] || '1.';
	var scalar = options['scalar'] || 'vScalar';
	this.getField = options['getField'];
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 uncovered 		= @UNCOVERED;
			vec4 ocean 			= mix(OCEAN, uncovered, 0.5);
			vec4 sea_covered 	= vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			gl_FragColor = sea_covered;
			**/}))
		.replace('@UNCOVERED', 'heat( smoothstep(@MIN, @MAX, @SCALAR) )')
		.replace('@MIN', min)
		.replace('@MAX', max)
		.replace('@SCALAR', scalar);
}
ScalarHeatDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;
};
ScalarHeatDisplay.prototype.removeFrom = function(mesh) {
	
};
ScalarHeatDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	scalar = geometry.attributes.scalar.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var scalar_model = this.getField !== void 0? this.getField(plate) : void 0;
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
		if (scalar_model !== void 0) {
			scalar[j] = is_member * scalar_model[buffer_array_index]; 
		}
	}
	geometry.attributes.displacement.needsUpdate = true;
	if (scalar_model !== void 0) {
		geometry.attributes.scalar.needsUpdate = true;
	}
}
scalarDisplays.temp 	= new ScalarHeatDisplay( { min: '-25.', max: '30.', scalar: 'temp', } );
scalarDisplays.precip = new ScalarHeatDisplay( { min: '2000.', max: '0.', scalar: 'precip', } );
scalarDisplays.age 	= new ScalarHeatDisplay( { min: '250.', max: '0.',  
		getField: function (plate) {
			return plate.age;
		} 
	} );
scalarDisplays.thickness 	= new ScalarHeatDisplay( { min: '6000.', max: '70000.',  
		getField: function (plate) {
			return plate.thickness;
		} 
	} );
scalarDisplays.density 	= new ScalarHeatDisplay( { min: '2700.', max: '3300.',  
		getField: function (plate) {
			return plate.density;
		} 
	} );

var subduction_min_age_threshold = 150;
var subduction_max_age_threshold = 200;
var subductability_transition_factor = 1/100;
function getSubductability (plate) {
	function lerp(a,b, x){
		return a + x*(b-a);
	}
	function smoothstep (edge0, edge1, x) {
		var fraction = (x - edge0) / (edge1 - edge0);
		return clamp(fraction, 0.0, 1.0);
		// return t * t * (3.0 - 2.0 * t);
	}
	function clamp (x, minVal, maxVal) {
		return Math.min(Math.max(x, minVal), maxVal);
	}
	function heaviside_approximation (x, k) {
		return 2 / (1 + Math.exp(-k*x)) - 1;
		return x>0? 1: 0; 
	}
	function get_subductability (density, age) {
		var continent = smoothstep(2890, 2800, density);
		var density = 	density * continent 	+ 
						lerp(density, 3300, 
							 smoothstep(
								subduction_min_age_threshold, 
								subduction_min_age_threshold, 
								age)) 
							* (1-continent)
		return heaviside_approximation( density - 3000, subductability_transition_factor );
	}
	var subductability = ScalarField.VertexTypedArray(plate.grid);
	var is_member = plate.is_member;
	var age = plate.age;
	var density = plate.density;
	for (var i=0, li=subductability.length; i<li; ++i) {
	    subductability[i] = is_member[i] * get_subductability(density[i], age[i]);
	}
	return subductability;
} 
function getSubductabilitySmoothed(plate, iterations) {
	iterations = iterations || 30;
	var field = getSubductability(plate);
	var laplacian = ScalarField.VertexTypedArray(plate.grid);
	for (var i=0; i<iterations; ++i) {
		ScalarField.vertex_laplacian(field, plate.grid, laplacian);
		ScalarField.add_field(field, laplacian, field);
	}
	return field;
}
scalarDisplays.subductability = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: getSubductability
	} );
scalarDisplays.subductability_smoothed = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: getSubductabilitySmoothed
	} );
scalarDisplays.subductability_smoothed_laplacian = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductability(plate)
			var laplacian = ScalarField.vertex_laplacian(field, plate.grid);
			// var gradient = ScalarField.vertex_gradient(field, plate.grid);
			// laplacian = VectorField.vertex_divergence(gradient, plate.grid);
			return laplacian;
		} 
	} );
scalarDisplays.flood_fill1 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			return flood_fill;
		}
	} );
scalarDisplays.flood_fill2 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill3 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill4 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill4, 0.4, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill5 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill4, 0.4, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill5, 0.3, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill6 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill4, 0.4, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill5, 0.3, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill6, 0.2, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill7 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill4, 0.4, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill5, 0.3, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill6, 0.2, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill7, 0.15, flood_fill);
			return flood_fill;
		}
	} );
scalarDisplays.flood_fill8 = new ScalarHeatDisplay(  { 
		min: '1.', max: '0.',
		getField: function (plate) {
			var field = getSubductabilitySmoothed(plate);
			var gradient = ScalarField.vertex_gradient(field, plate.grid);
			var angular_velocity = VectorField.cross_vector_field(gradient, plate.grid.pos);
			var gradient = angular_velocity;
			
			var magnitude = VectorField.magnitude(gradient);
			var max_id = ScalarField.max_id(magnitude);
			var mask = ScalarField.VertexTypedArray(plate.grid, 1);
			var flood_fill = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill, mask);
			var flood_fill2 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill2, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill2, mask);
			var flood_fill3 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill3, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill3, mask);
			var flood_fill4 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill4, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill4, mask);
			var flood_fill5 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill5, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill5, mask);
			var flood_fill6 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill6, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill6, mask);
			var flood_fill7 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.sub_field(magnitude, ScalarField.mult_field(flood_fill7, magnitude), magnitude);
			max_id = ScalarField.max_id(magnitude);
			ScalarField.sub_field(mask, flood_fill7, mask);
			var flood_fill8 = VectorField.vertex_flood_fill(gradient, plate.grid, max_id, mask);

			ScalarField.add_field_term(flood_fill, flood_fill2, 0.6, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill3, 0.5, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill4, 0.4, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill5, 0.3, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill6, 0.2, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill7, 0.15, flood_fill);
			ScalarField.add_field_term(flood_fill, flood_fill8, 0.1, flood_fill);
			return flood_fill;
		}
	} );

function RealisticDisplay(shader_return_value) {
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 ocean 				= mix(OCEAN, SHALLOW, smoothstep(epipelagic * sealevel_mod, sealevel * sealevel_mod, vDisplacement));
			vec4 bedrock			= mix(MAFIC, FELSIC, felsic_fraction);
			vec4 soil				= mix(bedrock, mix(SAND, PEAT, organic_fraction), mineral_fraction);
			vec4 canopy 			= mix(soil, JUNGLE, npp);
			
			vec4 uncovered = @UNCOVERED;
			vec4 sea_covered = vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			vec4 ice_covered = mix(sea_covered, SNOW, ice_fraction);
			gl_FragColor = ice_covered;
			**/}))
		.replace('@UNCOVERED', shader_return_value);
}
RealisticDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;
};
RealisticDisplay.prototype.removeFrom = function(mesh) {
	
};
RealisticDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
	}
	geometry.attributes.displacement.needsUpdate = true;
}
scalarDisplays.satellite = new RealisticDisplay('canopy');
scalarDisplays.soil = new RealisticDisplay('soil');
scalarDisplays.bedrock = new RealisticDisplay('bedrock');


function DebugDisplay(shader_return_value) {
	this._fragmentShader = fragmentShaders.debug;
}
DebugDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader; 
	mesh.material.needsUpdate = true;
	mesh.material.uniforms.color.value =  new THREE.Color(Math.random() * 0xffffff);
	mesh.material.uniforms.color.needsUpdate = true;
};
DebugDisplay.prototype.removeFrom = function(mesh) {
	
};
DebugDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
	}
	geometry.attributes.displacement.needsUpdate = true;
}
scalarDisplays.debug = new DebugDisplay();