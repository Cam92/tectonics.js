'use strict';

function TopographicRasterView(options) {
	var invariant_options = options || {};
	var max = invariant_options['max'] || 1.;
	var scaling = invariant_options['scaling'] || (!invariant_options['max']);
	var chartView = invariant_options['chartView'] || new PdfChartRasterView('land'); 
	this.scaling = scaling;
	var fragmentShader = fragmentShaders.topographic;

	this.mesh = void 0;
	var mesh = void 0;
	var uniforms = {};
	var vertexShader = void 0;
	var scaled_raster = void 0;


	function create_mesh(raster, options) {
		var grid = raster.grid;
		var faces = grid.faces;
		var geometry = THREE.BufferGeometryUtils.fromGeometry({
			faces: grid.faces, 
			vertices: grid.vertices, 
			faceVertexUvs: [[]], // HACK: necessary for use with BufferGeometryUtils.fromGeometry
		});
		geometry.addAttribute('displacement', Float32Array, faces.length*3, 1);
		geometry.addAttribute('scalar', Float32Array, faces.length*3, 1);

		var material = new THREE.ShaderMaterial({
			attributes: {
			  displacement: { type: 'f', value: null },
			  scalar: { type: 'f', value: null }
			},
			uniforms: {
			  sealevel:     { type: 'f', value: 0 },
			  sealevel_mod: { type: 'f', value: options.sealevel_mod },
			  index: 		{ type: 'f', value: options.index },
			},
			blending: THREE.NoBlending,
			vertexShader: options.vertexShader,
			fragmentShader: fragmentShader
		});
		return new THREE.Mesh( geometry, material);
	}
	function update_vertex_shader(value) {
		if (vertexShader !== value) {
			vertexShader = value;
			mesh.material.vertexShader = value; 
			mesh.material.needsUpdate = true; 
		}
	}
	function update_uniform(key, value) {
		if (uniforms[key] !== value) {
			uniforms[key] = value;
			mesh.material.uniforms[key].value = value;
			mesh.material.uniforms[key].needsUpdate = true;
		}
	}
	function update_attribute(key, raster) {
		Float32Raster.get_ids(raster, raster.grid.buffer_array_to_cell, mesh.geometry.attributes[key].array); 
		mesh.geometry.attributes[key].needsUpdate = true;
	}

	this.updateScene = function(gl_state, raster, options) {

		if (raster === void 0) {
			this.removeFromScene(gl_state);
			return;
		}

		if (raster instanceof Uint8Array) {
			raster = Float32Raster.FromUint8Raster(raster);
		}
		if (raster instanceof Uint16Array) {
			raster = Float32Raster.FromUint16Raster(raster);
		}

		if (scaled_raster === void 0 || scaled_raster.grid !== raster.grid) {
			scaled_raster = Float32Raster(raster.grid);
		}
		
		if (scaling) {
			ScalarField.mult_scalar(raster, 1./Float32Dataset.max(raster), scaled_raster);
		} else {
			ScalarField.mult_scalar(raster, 1./max, scaled_raster);
		}

		if (mesh === void 0) {
			mesh = create_mesh(scaled_raster, options);
			uniforms = {...options};
			vertexShader = options.vertexShader;
			gl_state.scene.add(mesh);

			// HACK: we expose mesh here so WorldViews can modify as they see fit, 
			// 	  namely for displacement and sealevel attributes
			this.mesh = mesh; 
		} 

		update_attribute('scalar', 			scaled_raster);
				
		update_uniform('sealevel_mod',		options.sealevel_mod);
		update_uniform('index',				options.index);

		update_vertex_shader(options.vertexShader);

		if (options.displacement !== void 0) {
			update_attribute('displacement', options.displacement);
		}
		if (options.displacement !== void 0) {
			update_uniform('sealevel', 		options.sealevel);
		}
	};
	this.removeFromScene = function(gl_state) {
		if (mesh !== void 0) {
			gl_state.scene.remove(mesh);
			mesh.geometry.dispose();
			mesh.material.dispose();
			mesh = void 0;
			this.mesh = void 0;
		} 
		scaled_raster = void 0;
	};
	this.clone = function() {
		return new  TopographicRasterView(invariant_options);
	}
	this.updateChart = function(data, raster, options) {
		chartView.updateChart(data, raster, options);
	}
}