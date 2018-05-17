'use strict';

// An orbit is a low level mathematical data structure, similar in nature to the "Raster" classes.
// It can be thought of as any conic path drawn across space, regardless of the force that causes it.
// Along with the standard gravitational parameter, "GM" it can be treated as a function mapping time to a tuple of position and velocity
// For a non-binary system, GM is equal to the gravitational constant multiplied by the mass of the parent object
//  * An orbit does not require a planet - it could, for instance, describe a motion between barycenters.
//    It is no more dependant on a celestial body than a velocity vector is dependant on a physical object
//    As such, the "Orbit" class does not track celestial bodies within its attributes.
//  * An orbit could be affected by celestial bodies over time. 
//    Since this requires knowledge of all celestial objects in the universe, 
//    We only handle this logic in the "Universe" class. 
function Orbit(parameters) {
	var self = this;

	// the average between apoapsis and periapsis
	var semi_major_axis					= parameters['semi_major_axis'] 				|| stop('missing parameter: "semi_major_axis"');
	// the shape of the orbit, where 0 is a circular orbit and >1 is a hyperbolic orbit
	var eccentricity					= parameters['eccentricity'] 					|| 0.;
	// the angle (in radians) between the orbital plane and the reference plane (the intersection being known as the "ascending node")
	var inclination						= parameters['inclination'] 					|| 0.;
	// the angle (in radians) between the ascending node and the periapsis
	var argument_of_periapsis			= parameters['argument_of_periapsis'] 			|| 0.;
	// the angle (in radians) between the prime meridian of the parent and the "ascending node" - the intersection between the orbital plane and the reference plane
	var longitude_of_ascending_node		= parameters['longitude_of_ascending_node'] 	|| 0.;
	// effective mass of the parent body
	// We say it is "effective" because sometimes no parent body exists (i.e. barycenters)
	// It is not typically included in textbooks amongst orbital parameters,
	// but it allows us to make statements that concern timing: velocity, period, etc.
	var effective_parent_mass  			= parameters['effective_parent_mass'] 			|| 0.;

	this.period = function(orbit) {
		return OrbitalMechanics.get_period(orbit.semi_major_axis, orbit.effective_parent_mass);
	}

	// "position" returns the position vector that is represented by an orbit 
	this.get_child_to_parent_matrix = function(mean_anomaly) {
		return OrbitalMechanics.get_orbit_matrix4x4(
				mean_anomaly,
				semi_major_axis, 
				eccentricity, 
				inclination,
				argument_of_periapsis,
				longitude_of_ascending_node
			);
	}
	this.get_parent_to_child_matrix = function(mean_anomaly) {
		return Matrix4x4.invert(this.get_child_to_parent_matrix(mean_anomaly));
	}

	// private variables 
	var mean_anomaly_refresh			  = 0.;

	this.iterate = function(mean_anomaly, timestep) {
		var period = this.period();
		var TURN = 2*Math.PI;
		return (mean_anomaly + TURN*(timestep / period)) % TURN;
	};
}
