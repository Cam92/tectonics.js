/* eslint-env qunit */
QUnit.module('Rasters');

// "Components.js" tests behavior of components and systems 
//  within the model layer's "Entity-Component-System" ("ECS") architecture. 
// See blog/ramblings/rearchitecture-roadmap.md for documentation 
//  surrounding the thought process that went into the design of these unit tests.

var vega_body_json       = { name: 'Vega', age:  455*Units.MEGAYEAR };
var sun_body_json        = { name: 'Sol',  age: 4500*Units.MEGAYEAR };

var vega_body_component = new Body(vega_body_json );
var sun_body_component  = new Body(sun_body_json        );

var vega_star_json = { 
	mass_H:  0.97 * 2.135 * Units.SOLAR_MASS, 
	mass_He: 0.03 * 2.135 * Units.SOLAR_MASS 
};
var sun_star_json        = { 
	mass_H:  0.75 *         Units.SOLAR_MASS, 
	mass_He: 0.25 *         Units.SOLAR_MASS 
};

var vega_star_component = new Star(vega_star_json);
var sun_star_component        = new Star(sun_star_json       );
var default_star_component    = new Star({});
var scratch_star_component    = new Star({});

test_unary_inverse(
	star   => star.getParameters(),
	'star.getParameters',
	params => new Star(params),
	'new Star',
	{ 
		sun:        sun_star_component,
		vega: vega_star_component,
		default:    default_star_component,
	},
);
test_unary_inverse(
	params => new Star(params),
	'new Star',
	star   => star.getParameters(),
	'star.getParameters',
	{ 
		sun:        sun_star_json,
		vega: vega_star_json,
	},
);

test_value_is_to_within(
    sun_star_component.total_mass(),
    Units.SOLAR_MASS,
    0.01,
    'star.total_mass()',
    "must predict mass of the Sun to within 1%"
);
test_value_is_to_within(
    sun_star_component.radius(),
    Units.SOLAR_RADIUS,
    0.01,
    'star.radius()',
    "must predict radius of the Sun to within 1%"
);
test_value_is_to_within(
    sun_star_component.luminosity(),
    Units.SOLAR_LUMINOSITY,
    0.01,
    'star.luminosity()',
    "must predict luminosity of the Sun to within 1%"
);
test_value_is_to_within(
    sun_star_component.surface_temperature(),
    Units.SOLAR_TEMPERATURE,
    0.01,
    'star.surface_temperature()',
    "must predict temperature of the Sun to within 1%"
);




test_value_is_to_within(
    vega_star_component.total_mass(),
    2.135 * Units.SOLAR_MASS,
    0.01,
    'star.total_mass()',
    "must predict mass of Vega to within 1%"
);
test_value_is_to_within(
    vega_star_component.radius(),
    2.362 * 2.818 * Units.SOLAR_RADIUS,
    2.0,
    'star.radius()',
    "must predict radius of Vega to within a factor of 2"
);
test_value_is_to_within(
    vega_star_component.luminosity(),
    40.12 * Units.SOLAR_LUMINOSITY,
    2.0,
    'star.luminosity()',
    "must predict luminosity of Vega to within a factor of 2"
);
test_value_is_to_within(
    vega_star_component.surface_temperature(),
    9602,
    0.10,
    'star.surface_temperature()',
    "must predict temperature of Vega to within 1%"
);

var earth_body_json      = { name: 'Earth',      age: 4500*Units.MEGAYEAR };
var jupiter_body_json    = { name: 'Jupiter',    age: 4500*Units.MEGAYEAR };

var earth_body_component      = new Body(earth_body_json      );
var jupiter_body_component    = new Body(jupiter_body_json    );

var earth_world_json = { 
	mass_FeNi: 2.35e24,
	mass_SiX : 3.65e24,
	mass_H2O : 1.4e21,
	mass_HHe : 0,
};
var jupiter_world_json = { 
	mass_FeNi: 0,
	mass_SiX : 0,
	mass_H2O : 0.05 * Units.JUPITER_MASS,
	mass_HHe : 0.95 * Units.JUPITER_MASS,
};

var earth_world_component   = new World(earth_world_json);
var jupiter_world_component = new World(jupiter_world_json);
var default_world_component = new World({});
var scratch_world_component = new World({});

test_unary_inverse(
	world   => world.getParameters(),
	'world.getParameters',
	params => new World(params),
	'new World',
	{ 
		earth:   earth_world_component,
		jupiter: jupiter_world_component,
		default: default_world_component,
	},
);
test_unary_inverse(
	params => new World(params),
	'new World',
	world   => world.getParameters(),
	'world.getParameters',
	{ 
		earth:   earth_world_json,
		jupiter: jupiter_world_json,
	},
);

test_value_is_to_within(
    earth_world_component.total_mass(),
    Units.EARTH_MASS,
    0.01,
    'world.total_mass()',
    "must predict mass of the Earth to within 1%"
);
test_value_is_to_within(
    earth_world_component.radius(),
    Units.EARTH_RADIUS,
    0.01,
    'world.radius()',
    "must predict radius of the Earth to within 1%"
);
test_value_is_to_within(
    earth_world_component.surface_gravity(),
    Units.STANDARD_GRAVITY,
    0.01,
    'world.surface_gravity()',
    "must predict surface gravity of the Earth to within 1%"
);

test_value_is_to_within(
    jupiter_world_component.total_mass(),
    Units.JUPITER_MASS,
    0.01,
    'world.total_mass()',
    "must predict mass of Jupiter to within 1%"
);
test_value_is_to_within(
    jupiter_world_component.radius(),
    Units.JUPITER_RADIUS,
    0.01,
    'world.radius()',
    "must predict radius of Jupiter to within 1%"
);

// from https://www.engineeringtoolbox.com/air-composition-d_212.html
var earth_atmo_mass = 5.148e18;
var earth_atmo_mean_molecular_mass = 28.9647;
var earth_atmo_json = { 
    mass_N2  : earth_atmo_mass * 21.873983/earth_atmo_mean_molecular_mass,
    mass_O2  : earth_atmo_mass *  6.702469/earth_atmo_mean_molecular_mass,
    mass_CO2 : earth_atmo_mass *  0.014677/earth_atmo_mean_molecular_mass,
    mass_H2O : earth_atmo_mass *  0.001   /earth_atmo_mean_molecular_mass,
    mass_CH4 : earth_atmo_mass *  0.000029/earth_atmo_mean_molecular_mass,
    mass_C2H6: earth_atmo_mass *  0       /earth_atmo_mean_molecular_mass,
    mass_Ar  : earth_atmo_mass *  0.373114/earth_atmo_mean_molecular_mass,
    mass_He  : earth_atmo_mass *  0.000021/earth_atmo_mean_molecular_mass,
    mass_H2  : earth_atmo_mass *  0.000001/earth_atmo_mean_molecular_mass,
};
var earth_atmo_component   = new Atmosphere(earth_atmo_json);
var default_atmo_component = new Atmosphere({});

test_unary_inverse(
    atmosphere => atmosphere.getParameters(),
    'atmosphere.getParameters',
    params => new Atmosphere(params),
    'new Atmosphere',
    { 
        earth:   earth_atmo_component,
        default: default_atmo_component,
    },
);
test_unary_inverse(
    params => new Atmosphere(params),
    'new Atmosphere',
    atmosphere => atmosphere.getParameters(),
    'atmosphere.getParameters',
    { 
        earth:   earth_atmo_json, 
    },
);
test_value_is_to_within(
    earth_atmo_component.total_mass(),
    earth_atmo_mass,
    0.01,
    'atmosphere.total_mass()',
    "must predict mass of Earth's atmosphere to within 1%"
);
test_value_is_to_within(
    earth_atmo_component.molecule_count(),
    1e44,
    0.1,
    'atmosphere.molecule_count()',
    "must predict number of molecules in Earth's atmosphere to within 10%"
);
test_value_is_to_within(
    earth_atmo_component.mean_molecular_mass(),
    earth_atmo_mean_molecular_mass*Units.DALTON,
    0.01,
    'atmosphere.mean_molecular_mass()',
    "must predict mean molecular mass of Earth's atmosphere to within 1%"
);

// TODO: specific heat capacity

test_value_is_to_within(
    earth_atmo_component.scale_height(Units.STANDARD_GRAVITY, Units.STANDARD_TEMPERATURE),
    8*Units.KILOMETER,
    0.01,
    'atmosphere.scale_height()',
    "must predict scale height of Earth's atmosphere to within 1%"
);
test_value_is_to_within(
    earth_atmo_component.surface_pressure(Units.STANDARD_GRAVITY, earth_world_component.surface_area()),
    Units.STANDARD_PRESSURE,
    0.10,
    'atmosphere.surface_pressure()',
    "must predict surface air pressure on Earth to within 10%"
);

// TODO: surface density
// TODO: surface molecular density
// TODO: lapse rate
// test_value_is_to_within(
//     earth_atmo_component.lapse_rate(Units.STANDARD_GRAVITY),
//     9.8*Units.KELVIN/Units.KILOMETER,
//     0.1,
//     'atmosphere.surface_pressure()',
//     "must predict average lapse rate on Earth to within 10%"
// );

test_value_is_to_within(
    earth_atmo_component.rayleigh_scattering_cross_section(650*Units.NANOMETER) * 
    earth_atmo_component.surface_molecular_density(Units.STANDARD_GRAVITY, earth_world_component.surface_area(), Units.STANDARD_TEMPERATURE),
    5.20e-6,
    0.10,
    'atmosphere.rayleigh_scattering_cross_section()',
    "must predict rayleigh scattering cross section for surface air on earth to within 10%"
);

// // get_steady_state should allow an output parameter to be passed to it
// // if provided, this output parameter will be returned as output
// test_unary_output_reference(
// 	Star.get_steady_state,
// 	'Star.get_steady_state',
// 	{ 
// 		sun: sun_body_component,
// 		out: scratch_star_component,
// 	},
// );

// // get_steady_state should be idempotent
// test_unary_output_idempotence(
// 	Star.get_steady_state,
// 	'Star.get_steady_state',
// 	{ sun: sun_body_component },
// );

// // get_steady_state should remain idempotent, 
// // even when used for in-place operations.
// // This is meant to guard against problems that arise due to the sequencing 
// //   of operations within the function. 
// test_unary_output_idempotence(
// 	body => Star.get_steady_state(body, sun_star_component),
// 	'Star.get_steady_state',
// 	{ sun: sun_body_component },
// );
