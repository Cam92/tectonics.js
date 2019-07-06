'use strict';

// a universe is a collection of celestial bodies that interact with one another
// the data structure is designed to allow for:
//  * iterative physics simulation
//  * "on-rails" simulation, ala Kerbal Space Program
//  * arbitrary assignment of cycle states from the user (since the cycle is ergodic - any state is likely occur within a single million year timestep)
// design principles:
//  1. must be able to easily update the state of all "on-rails" motions 
//  2. must be able to easily update the state of all bodies
//  3. must be able to easily track the position and orientation of all bodies relative to any other body
//  4. must be able to easily find the incident radiation incurred on all bodies from all stars, **for an arbitrary cycle configuration**
//  4. must be able to easily find the gravity induced on all bodies from all other bodies
//  5. must be able to enumerate all bodies to for easy selection by the user
// conclusions:
//  a. must contain a nested structure of all bodies, since this reflects the underlying data
//  b. from 1.), must contain an easily traversed structure of all motions
//  c. from 2.), must contain an easily traversed structure of all bodies
//  d. from 3.), must contain a function that returns a map between bodies and their transformation matrices
//  e. from 4.), must contain an easily traversed structure of all stars
//  d. from 4.), must **not store cycle configuration as an attribute of motion!** Cycle configuration must be stored in a separate structure
//  e. from d.), must have a way to map between motions in a hierarchy and state within a cycle configuration structure, i.e. a unique key for each motion
// 
// so we have the following:
// 
//    ancestors(hierarchy, node)
//        returns a hierarchy containing only immediate ancestors of a given node 
//    descendants(hierarchy, node)
//        returns a hierarchy containing only immediate descendants of a given node 
//    zip(hierarchy1, hierarchy2)
//        zips two hierarchies into one
//    prune(hierarchy, nodes)
//        returns a hierarchy containing only cycles relating to a list of given nodes
//        effectively zip(ancestors(node1), ancestors(node2), ...)
//        usage for insolation is: prune(star1, star2, planet)
//    matrices(hierarchy, state, origin)
//        returns a dict mapping bodies to matrices that represent body position/rotation relative to origin node
//    iterate(hierarchy, state, timestep)
//        returns a state object representing cycle state after a given timestep
//    insolation(hierarchy, state)
//        returns a scalar field representing insolation at a well defined state
//    insolation(hierarchy, state, averaging_window_size, sample_num)
//        returns a scalar field representing average insolation across a averaging_window_size
//        we simply average between the fields and hope no resonance exists between cycles
//        can use several methods:
//            successively iterate() through averaging_window_size by 1.61 times period of shortest cycle
//            successively iterate() by 1.61^n that approximates averaging_window_size / sample_num
//            successively iterate() by averaging_window_size / sample_num
//


function Universe(parameters) {
    // "config" expresses the current configuration of the cyclical motions within the universe
    // this is done using phase angles (e.g. number from 0 to 2*pi where pi represents the halfway point within the cycle)
    // example: { 'earth-revolution': pi*1/2, 'earth-rotation': pi*3/4, 'moon-revolution': pi*0}
    this.config = parameters.config || {};
    // A "cycle" represents the cyclical motion of one or more celestial bodies that share a common reference frame. 
    // The reference frame may be moving within a larger parent cycle, and may itself have subcycles as children. 
    // For instance, moons can orbit planets that orbit stars.
    // A cycle may contain a celestial body at its center but this is not strictly necessary,
    // For instance, the two planets may orbit a common barycenter. 
    // Cycles do not track the phase angle of their motions. 
    // Phase angle is stored separately, in "config". 
    // This is done because phase angle may change very frequently over large timesteps,
    //  where ergodic behavior emerges, and it is often not relevant to track it in these situations
    var cycles =  Object.keys(parameters.cycles)
        .reduce((accumulator, id) => { accumulator[id] = new CelestialCycle(parameters.cycles[id]); return accumulator; }, {} );
    // A "body" represents a celestial body: a collection of matter that is tightly bound by gravity.
    var bodies  =  Object.keys(parameters.bodies)
        .reduce((accumulator,  id) => { 
            var body = parameters.bodies[id];
            accumulator[id] = {
                undefined: () => body,
                'world': () => new World(body),
                'star': () => new Star(body),
            }[body.type](); 
            return accumulator; 
        }, {} );

    this.getParameters = function() {
        return {
            config:  this.config,
            cycles: Object.keys(cycles)
                .reduce((accumulator, id) => { accumulator[id] = cycles[id].getParameters(); return accumulator; }, {} ),
            bodies:  Object.keys(bodies)
                .reduce((accumulator, id) => { accumulator[id] = bodies [id].getParameters(); return accumulator; }, {} ),
        }
    }

    this.cycles = cycles;
    this.bodies  = bodies;

    // given a body name, "cycle_of_body()" returns the cycle at which the body is the center
    // it is of O(N) complexity, where N is the number of cycles
    function cycle_of_body(body_id) {
        return Object.values(cycles).filter(x => x.body == body_id)[0];
    }

    // NOTE: min_perceivable_period = 30/2 * timestep // half a second of real time
    // time below which user could no longer perceive the effects of a cycle, in simulated seconds
    // NOTE: max_perceivable_period = 60*60*24*30 * timestep // 1 day worth of real time at 30fps
    // time above which user could no longer perceive the effects of a cycle, in simulated seconds

    //given a cycle configuration, "advance()" returns the cycle configuration that would occur after a given amount of time
    function advance(config, timestep, output, min_perceivable_period, max_perceivable_period) {
        output = output || {};
        for(var id in cycles){
            if (cycles[id] === void 0) { continue; }
            var period = cycles[id].motion.period();
            // default to current value, if present
            if (config[id]) { output[id] = config[id]};
            // if cycle completes too fast for the user to perceive, don't simulate 
            if (period < min_perceivable_period)     { continue; }
            // if cycle completes too slow for the user to perceive, don't simulate
            if (period > max_perceivable_period)     { continue; }
            output[id] = ((config[id] || 0) + 2*Math.PI * (timestep / period)) % (2*Math.PI);
        }

        return output;
    }

    // given a cycle configuration and timestep, 
    // "sample()" generates a list of cycle configurations that are representative of that timestep
    // this is useful for finding, e.g. mean daily solar radiation
    // the function will not generate more than a given number of samples per cycle
    function samples(config, max_sample_count, min_perceivable_period) {
        // if the cycle takes more than a given amount to complete, 
        // then don't sample across it
        var imperceptably_small_cycles = Object.values(cycles)
            .filter(cycle => {
                return (cycle !== void 0 &&
                        cycle.motion.period() < min_perceivable_period &&
                       !cycle.invariant_insolation);
            })
            .sort((a,b) => a.motion.period() - b.motion.period())
            .reverse();
        // figure out how many samples you can allocate to each cycle without compromising performance.
        // Round down to the nearest whole number.
        var samples_per_cycle = Math.floor(Math.pow(max_sample_count, 1/imperceptably_small_cycles.length));
        // we return a list of configs to sample across, starting with a clone of `config`
        var samples = [Object.assign({}, config)];
        // for each imperceptably small cycle:
        for(var cycle of imperceptably_small_cycles) {
            // sample across the cycle's period and add results to `samples`
            var period = cycle.motion.period();
            var subsamples = [];
            for (var sample of samples) {
                for (var j = 0; j < samples_per_cycle; j++) {
                    subsamples.push(advance(sample, j*period/samples_per_cycle, {}, 1));
                }
            }
            samples = subsamples;
        }
        return samples;
    }

    // returns a dictionary mapping body ids for stars to a list of positions sampled along their orbits
    function star_sample_positions_map(config, body, min_perceivable_period, max_sample_count) {
        max_sample_count = max_sample_count || 16;
        var origin   = cycle_of_body(body.id);
        var samples_ = samples(config, max_sample_count, min_perceivable_period);
        var stars = Object.values(bodies).filter(body => body instanceof Star);
        var result = {};
        for (var sample of samples_){
            var body_matrices = origin.get_body_matrices(sample, cycles);
            for (var star of stars) {
                var star_matrix = body_matrices[star.id];
                var star_pos = Matrix4x4.get_translation(star_matrix);
                result[star.id] = result[star.id] || [];
                result[star.id].push(star_pos);
            }
        }
        return result;
    }

    // average insolation from all stars
    function average_insolation(config, body, min_perceivable_period, average_insolation, max_sample_count){
        var surface_normal = body.grid.pos;
        max_sample_count = max_sample_count || 25;
        var average_insolation = average_insolation || Float32Raster(body.grid);
        var insolation_sample = Float32Raster(body.grid);
        Float32Raster.fill(average_insolation, 0);

        var stars = Object.values(bodies).filter(body => body instanceof Star);
        var star_sample_positions_map_ = star_sample_positions_map(config, body, min_perceivable_period, max_sample_count);
        for (var star of stars){
            var star_memos = Star.get_memos(star);
            var star_sample_positions = star_sample_positions_map_[star.id];
            for (var star_sample_position of star_sample_positions) {
                Optics.get_incident_radiation_fluxes(
                    surface_normal,
                    star_sample_position, 
                    star_memos.luminosity()/star_sample_positions.length,
                    insolation_sample
                );
                ScalarField.add_field(average_insolation, insolation_sample, average_insolation);
            }
        }
        return average_insolation;
    }

    function assert_dependencies() { }

    // returns a dictionary mapping body ids to transformation matrices
    this.body_matrices = function(config, body) {
        return cycle_of_body(body.id).get_body_matrices(config, cycles);
    }
    this.star_sample_positions_map = star_sample_positions_map;
    this.advance        = advance;
    this.cycle_of_body = cycle_of_body;
    this.average_insolation_of_body = function(body, simulation_speed, result, max_sample_count) {
        result    = result || Float32Raster(body.grid);
        max_sample_count = max_sample_count || 25;
        average_insolation(
                this.config,
                body, 
                simulation_speed/2.,
                result,
                max_sample_count
            );
        return result;
    }

    this.setDependencies = function(dependencies) {}

    this.initialize = function() {
        assert_dependencies();
        for(var body_id in bodies) {
            var body = bodies[body_id];
            if (body instanceof World) {
                body.setDependencies({
                    get_average_insolation: ((timestep, out) => average_insolation(
                            this.config,
                            body, 
                            30/2 * timestep,  // TODO: set this to the correct fps
                            out,
                            25
                        )),
                });
            }
        }

        for(var cycle_id in cycles) {
            var cycle  = cycles[cycle_id];
            var body_id = cycle.body;
            var motion  = cycle.motion;
            if (body_id !== void 0 && motion instanceof Spin) {
                bodies[body_id].setDependencies({
                    axial_tilt:    motion.axial_tilt,
                    angular_speed: motion.angular_speed,
                });
            }
        }
        for(var body_id in bodies) {
            var body = bodies[body_id];
            body.initialize();
        }
    }

    this.invalidate = function() {
        for(var body_id in bodies) {
            var body = bodies[body_id];
            body.invalidate();
        }
    }

    this.calcChanges = function(timestep) {
        if (timestep === 0) {
            return;
        };
        assert_dependencies();

        for(var body_id in bodies){
            var body = bodies[body_id];
            // TODO: do away with this! We don't need to set mean anomaly!
            body.setDependencies({ 
                mean_anomaly: this.config['orbit'],
            });
        }

        for(var body_id in bodies){
            var body = bodies[body_id];
            body.calcChanges(timestep);
        }
    };

    this.applyChanges = function(timestep) {
        if (timestep === 0) {
            return;
        };
        assert_dependencies();

        advance(this.config, 
                timestep,
                this.config,
                1/2        * timestep, 
                60*60*24*30 * timestep
            ); 

        for(var body_id in bodies){
            var body = bodies[body_id];
            body.applyChanges(timestep);
        }
    };
}
