
var Float32RasterInterpolation = {};
Float32RasterInterpolation.lerp = function(a,b, x, result){
    for (var i = 0, li = result.length; i < li; i++) {
		result[i] = a + x[i]*(b-a);
    }
    return result;
}
Float32RasterInterpolation.smoothstep = function(edge0, edge1, x, result) {
	var fraction;
	var inverse_edge_distance = 1 / (edge1 - edge0);
    for (var i = 0, li = result.length; i < li; i++) {
		fraction = (x[i] - edge0) * inverse_edge_distance;
		result[i] = fraction > 1.0? 1.0 : fraction < 0.0? 0.0 : fraction;
	}
	return result;
}
//Float32RasterInterpolation.heaviside_approximation = function(x, k) {
//	return 2 / (1 + Math.exp(-k*x)) - 1;
//	return x>0? 1: 0; 
//}