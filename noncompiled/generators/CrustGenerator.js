'use strict';

var CrustGenerator = {};
CrustGenerator.generate = function (height_ranks, hypsography, attribute_height_maps, crust, random) {

    // order cells by this new found  "height rank"
    var sorted_cell_ids = new Uint16Array(height_ranks.length);
    for(var i=0, length = sorted_cell_ids.length; i<length; i++) {
        sorted_cell_ids[i] = i;
    }
    sorted_cell_ids.sort(function(a, b) { return height_ranks[a] - height_ranks[b]; });

    // Next we find elevations whose magnitude and frequency match those of earth's.
    // To do this, we generate a second dataset of equal size that represents actual elevations.
    // This dataset is generated from statistical distributions matching those found on earth. 
    // We sort the elevations and map each one to a cell from our height-rank sorted list.
    var sorted_height_samples = new Float32Array(sorted_cell_ids.length);
    for (var i = 0, li = sorted_height_samples.length; i < li; i++) {
        sorted_height_samples[i] = hypsography(random);
    };
    sorted_height_samples.sort(function(a,b) { return a-b; });

    // Now use the cell ids height ranks 
    var heights = Float32Raster.FromExample(height_ranks);
    for (var i = 0, li = sorted_cell_ids.length; i < li; i++) {
        heights[sorted_cell_ids[i]] = sorted_height_samples[i];
    }

    // Our model does not work directly with elevation.
    // We must express elevation in terms of thickness/density
    // To do this, we start off with a set of rock column templates expressing
    // what thickness/density should look like at a given density.
    // We then interpolate between these templated values.
    attribute_height_maps.sediment             (heights, crust.sediment        );
    attribute_height_maps.sedimentary        (heights, crust.sedimentary        );
    attribute_height_maps.metamorphic        (heights, crust.metamorphic        );
    attribute_height_maps.felsic_plutonic    (heights, crust.felsic_plutonic    );
    attribute_height_maps.felsic_volcanic    (heights, crust.felsic_volcanic    );
    attribute_height_maps.mafic_volcanic    (heights, crust.mafic_volcanic    );
    attribute_height_maps.age                (heights, crust.age                );
};

CrustGenerator.early_earth_hypsography = function(random) {
    var ocean_fraction = 0.95; // Earth = 0.71
    return random.uniform(0,1) < ocean_fraction? 
        random.normal(-4019,1113) :
        random.normal(797,1169);
};
CrustGenerator.modern_earth_hypsography = function(random) {
    var ocean_fraction = 0.6; // 60% of earth's crust is oceanic
    return random.uniform(0,1) < ocean_fraction? 
        random.normal(-4019,1113) :
        random.normal(797,1169);
};
CrustGenerator.modern_earth_attribute_height_maps = {
    // thicknesses are +/- 800, from White McKenzie and O'nions 1992
    mafic_volcanic: function(displacement, result, scratch) {
        return Float32RasterInterpolation.lerp(
            [-3200,         -200],
            [2890*7100,        0],
            displacement,
            result,
            scratch
        );
    },
    // thicknesses are +/- 2900, estimate for shields, from Zandt & Ammon 1995
    // 85% of continental crust is plutonic, 15% is volcanic, at least going by wikipedia
    felsic_plutonic: function(displacement, result, scratch) {
        return Float32RasterInterpolation.lerp(
            [-3200, -200,           840,            8848          ],
            [0,     2700*.85*28300, 2700*.85*36900, 2700*.85*70000],
            displacement,
            result,
            scratch
        );
    },
    felsic_volcanic: function(displacement, result, scratch) {
        return Float32RasterInterpolation.lerp(
            [-3200, -200,           840,            8848],
            [0,     2700*.15*28300, 2700*.15*36900, 2700*.15*70000],
            displacement,
            result,
            scratch
        );
    },
    sediment: function(displacement, result, scratch) {
        return Float32RasterInterpolation.lerp(
            [-3200, -200   ],
            [0,     2500.*5],
            displacement,
            result,
            scratch
        );
    },
    // displacements are from Charette & Smith 2010 (shallow ocean), enclopedia britannica (shelf bottom"continental slope"), wikipedia (shelf top), and Sverdrup & Fleming 1942 (land)
    age: function(displacement, result, scratch) {
        return Float32RasterInterpolation.lerp(
            [-11000,            -6000,             -3682,           -3200,             -200,              840],
            [250*Units.MEGAYEAR,200*Units.MEGAYEAR,0*Units.MEGAYEAR,100*Units.MEGAYEAR,100*Units.MEGAYEAR,1000*Units.MEGAYEAR],
            displacement,
            result,
            scratch
        );
    },
    sedimentary: function(displacement, result, scratch) {
        result = result || Float32Raster.FromExample(displacement);
        Float32Raster.fill(result, 0);
        return result;
    },
    metamorphic: function(displacement, result, scratch) {
        result = result || Float32Raster.FromExample(displacement);
        Float32Raster.fill(result, 0);
        return result;
    },
};
