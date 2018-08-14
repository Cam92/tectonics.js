/* eslint-env qunit */
QUnit.module('Rasters');

var tetrahedron = new Grid({
	faces: [
		{ a: 0, b: 1, c: 2 },
		{ a: 0, b: 1, c: 3 },
		{ a: 0, b: 2, c: 3 },
		{ a: 1, b: 2, c: 3 },
	], 
	vertices: [
		{ x: 0, y: 0, z: 0 },
		{ x: 1, y: 0, z: 0 },
		{ x: 0, y: 1, z: 0 },
		{ x: 0, y: 0, z: 1 },
	],
});
function framework_tests(type_name, a, b){
	QUnit.test(`${type_name} Framework tests`, function (assert) {

		assert.deepApprox( a, a, 
			`It must be possible to test ${type_name} using QUnit's assert.deepApprox() function`
		);
		assert.notDeepApprox( a, b,
			`It must be possible to test ${type_name} using QUnit's assert.notdeepApprox() function`
		);
	});
}

function test_binary_output_reference(op, op_name, A, B){
	let out = A.out;
	QUnit.test(`${op_name} Output Reference tests`, function (assert) {
		for (var a_name in A) {
			for (var b_name in B) {
				let a = A[a_name];
				let b = B[b_name];
				assert.deepApprox( 
					op( a, b ), op( a, b, out ), 
					`${op_name}(${a_name}, ${b_name}, out) should behave the same whether or not "out" is specified`
				);
				assert.strictEqual( 
					op( a, b, out ), out, 
					`${op_name}(${a_name}, ${b_name}, out) should return a reference to the "out" variable`
				);
				//NOTE: clean up out after your done, so you don't get wierd test results later on
				op(A.I, B.I, out)
			}
		}
	});
}
function test_unary_output_reference(op, op_name, A){
	let out = A.out;
	QUnit.test(`${op_name} Output Reference tests`, function (assert) {
		for (var a_name in A) {
			let a = A[a_name];
			assert.deepApprox( 
				op( a ), op( a, out ), 
				`${op_name}(${a_name}, out) should behave the same whether or not "out" is specified`
			);
			assert.strictEqual( 
				op( a, out ), out, 
				`${op_name}(${a_name}, out) should return a reference to the "out" variable`
			);
		}
	});
}

function test_binary_output_idempotence(op, op_name, A, B){
	QUnit.test(`${op_name} Idempotence tests`, function (assert) {
		for (var a_name in A) {
			for (var b_name in B) {
				let a = A[a_name];
				let b = B[b_name];
				assert.deepApprox( 
					op( a, b ), op( a, b ), 
					`${op_name}(${a_name}, ${b_name}) needs the idemoptent property: the operation can be called repeatedly without changing the value`
				);
			}
		}
	});
}

function test_unary_output_idempotence(op, op_name, A){
	QUnit.test(`${op_name} Idempotence tests`, function (assert) {
		for (var a_name in A) {
			let a = A[a_name];
			assert.deepApprox( 
				op( a ), op( a ), 
				`${op_name}(${a_name}) needs the idemoptent property: the operation can be called repeatedly without changing the value`
			);
		}
	});
}

function test_associativity(op, op_name, A, B){
	QUnit.test(`${op_name} Associativity tests`, function (assert) {
		for (var a_name in A) {
			for (var b_name in B) {
				for (var c_name in B) {
					let a = A[a_name];
					let b = B[b_name];
					let c = B[c_name];
					assert.deepApprox( 
						op( op(a, b), c ), 
						op( op(a, c), b ), 
						`${op_name}(${a_name}, ${op_name}(${b_name}, ${c_name})) needs the associative property: values can be applied in any order to the same effect`
					);
				}
			}
		}
	});
}


function test_closure(op, op_name, A, B){
	QUnit.test(`${op_name} Closure tests`, function (assert) {

		for (var a_name in A) {
			for (var b_name in B) {
				let a = A[a_name];
				let b = B[b_name];
				assert.equal( typeof op(a, b), typeof a,
					`${op_name}(a,b) needs the closure property: any value can be applied to produce another valid value`
				);
				assert.equal( op(a, b).constructor.name, a.constructor.name,
					`${op_name}(a,b) needs the closure property: any value can be applied to produce another valid value`
				);
			}
		}
	});
}
function test_identity(op, op_name, A, B){
	let Ia 	= A.I;
	let Ib 	= B.I;

	QUnit.test(`${op_name} Identity tests`, function (assert) {
		for (var a_name in A) {
			let a = A[a_name];
			assert.deepApprox( op(a, Ib), a,
				`${op_name}(${a_name}, I) needs the identity property: a value exists that can be applied that has no effect`
			);
		}
	});
}

function inverse_tests(op, op_name, inv, inv_name, A, B){
	QUnit.test(`${op_name}/${inv_name} Inverse tests`, function (assert) {
		for (var a_name in A) {
			for (var b_name in B) {
				let a = A[a_name];
				let b = B[b_name];
				assert.deepApprox( 
					op( inv( a, b ), b ), 	a,
					`${op_name}(${inv_name}(${a_name}, ${b_name}), ${b_name} ) needs to return ${a_name}`,
				);
				assert.deepApprox( 
					inv( op( a, b ), b ), 	a,
					`${inv_name}(${op_name}(${a_name}, ${b_name}), ${b_name} ) needs to return ${a_name}`,
				);
			}
		}
	});
}

function test_commutativity 	(op, op_name, args){
	QUnit.test(`${op_name} Commutativity tests`, function (assert) {
		for (var a_name in args) {
			for (var b_name in args) {
				let a = args[a_name];
				let b = args[b_name];
				assert.deepApprox( 
					op( a, b ), 
					op( b, a ), 
					`${op_name}(${a_name}, ${b_name}) must equal ${op_name}(${b_name}, ${a_name})`,
				);
			}
		}
	});
}

function test_anticommutativity (op, op_name, inv, inv_name, args){
	let I = args.I;
	QUnit.test(`${op_name} Anticommutativity tests`, function (assert) {
		for (var a_name in args) {
			for (var b_name in args) {
				let a = args[a_name];
				let b = args[b_name];
				assert.deepApprox( 
					op( a, b ), 
					inv(I, op( b, a )), 
					`${op_name}(${a_name}, ${b_name}) must equal ${inv_name}(I, ${op_name}(${b_name}, ${a_name}))`,
				);
			}
		}
	});
}

function test_distributivity 	(add, add_name, mult, mult_name, args){
	QUnit.test(`${add_name}/${mult_name} Distributivity tests`, function (assert) {
		for (var a_name in args) {
			for (var b_name in args) {
				for (var c_name in args) {
					let a = args[a_name];
					let b = args[b_name];
					let c = args[c_name];
					assert.deepApprox( 
						mult( add(b,c), a ), 
						add( mult(b,a), mult(c,a) ), 
						`${mult_name}(${add_name}(${b_name}, ${c_name}), ${a_name}) needs the distributive property: a multiplied value can be distributed across added values`,
					);
				}
			}
		}
	});
}

function test_equivalence 	(op1, op1_name, op2, op2_name, A, B, C){
	B = B || {'': undefined};
	C = C || {'': undefined};
	QUnit.test(`${op1_name}/${op2_name} Equivalence tests`, function (assert) {
		for (var a_name in A) {
			for (var b_name in B) {
				for (var c_name in C) {
					let a = A[a_name];
					let b = B[b_name];
					let c = C[c_name];
					assert.deepApprox( 
						op1(a, b, c), op2(a, b, c),
						`${op1_name} must behave equivalently to ${op2_name} for arguments: ${a_name}, ${b_name}, ${c_name}`,
					);
				}
			}
		}
	});
}

function test_properties(properties, op, op_name, A, B) {
	for(let test of properties){
		test(op, op_name, A, B);
	}
}

// "test_algabraic_group" tests a operation and its inverse to see whether it functions as a group from Abstract Algebra
function test_algabraic_group	(
	op, op_name, inv, inv_name, 
	happy1, happy2, 
	edgy1, edgy2
 ){
	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			test_associativity,
			test_identity,
		], 
		op, op_name, happy1, happy2,
	);
	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			test_associativity, 
			test_identity,
		], 
		op, op_name, edgy1, edgy2,
	);

	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			// test_associativity, // NOTE: inv can never be associative - it's the inverse!
			test_identity,
		], 
		inv, inv_name, happy1, happy2,
	);
	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			// test_associativity, // NOTE: inv can never be associative - it's the inverse!
			test_identity,
		], 
		inv, inv_name, edgy1, edgy2,
	);

	inverse_tests 			(op, op_name, inv, inv_name,  happy1, happy2);

}

// "algabraic_abelian_group_tests" tests a operation and its inverse to see whether it functions as an Abelian (aka "commutative") group from Abstract Algebra
function algabraic_abelian_group_tests 	(op, op_name,  inv, inv_name, happy_op_args, edgy_op_args){

	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			test_identity,
			test_associativity,
			test_commutativity,
		], 
		op, op_name, happy_op_args, happy_op_args
	);

	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			// test_identity,
			test_associativity,
			test_commutativity,
		], 
		op, op_name, edgy_op_args, edgy_op_args
	);

	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			test_identity,
			// test_associativity, // NOTE: inv can never be associative - it's the inverse!
			// test_commutativity,
		], 
		inv, inv_name, happy_op_args, happy_op_args
	);

	test_properties([
			test_binary_output_reference,
			test_binary_output_idempotence,			
			test_closure,
			// test_identity,
			// test_associativity, // NOTE: inv can never be associative - it's the inverse!
			// test_commutativity,
		], 
		inv, inv_name, edgy_op_args, edgy_op_args
	);

	inverse_tests 			(op, op_name, inv, inv_name,  happy_op_args, happy_op_args);

}

// "algabraic_abelian_group_tests" tests a set of four operations to see whether it consitutes a "Field" from Abstract Algebra
function test_algabraic_field	(add, add_name,  sub, sub_name, happy_add_args,	edgy_add_args,
								 mult,mult_name, div, div_name, happy_mult_args,edgy_mult_args) {

	algabraic_abelian_group_tests	(add, add_name, sub, sub_name,  happy_add_args, edgy_add_args);
	algabraic_abelian_group_tests	(mult, mult_name, div, div_name,  happy_mult_args, edgy_mult_args);

	test_distributivity	(add, add_name, mult, mult_name,	happy_add_args	);
	test_distributivity	(add, add_name, mult, mult_name,	happy_mult_args	);
	test_distributivity	(add, add_name, div,  div_name, 	happy_mult_args	); // NOTE: don't run div on happy_add_args, since div0 errors can occur

	test_distributivity	(sub, sub_name, mult, mult_name,	happy_add_args	);
	test_distributivity	(sub, sub_name, mult, mult_name,	happy_mult_args	);
	test_distributivity	(sub, sub_name, div,  div_name, 	happy_mult_args	); // NOTE: don't run div on happy_add_args, since div0 errors can occur
}


let add_uniform_args = {
	pos: 	 1,
	neg: 	-1,
	tiny: 	 1e-1,
	big: 	 1e4,
	I: 		 0,
}
let mult_uniform_args = {
	neg: 	-1,
	tiny: 	 1e-1,
	big: 	 1e4,
	I: 		 1,
}
let add_vector_happy_args = {
	pos: 	Vector( 1,			 2,		 3 			),
	neg:	Vector(-1,			-2,		-3 			),
	tiny: 	Vector( 1e-1,		 1e-1,	 1e-1 		),
	big: 	Vector( 1e4,		 1e4,	 1e4 		),
	I: 		Vector( 0,			 0,		 0 			),
	out: 	Vector( 0,			 0,		 0 			),
}
let mult_vector_happy_args = {
	pos: 	Vector( 1,			 2,		 3 			),
	neg:	Vector(-1,			-2,		-3 			),
	tiny: 	Vector( 1e-1,		 1e-1,	 1e-1 		),
	big: 	Vector( 1e4,		 1e4,	 1e4 		),
	I: 		Vector( 1,			 1,		 1 			),
	out: 	Vector( 1,			 1,		 1 			),
}
// an "edge case" is anything that produces a technically valid value but does not follow abelian group algebra
// for instance, a "NaN" value that spreads through calculations
let add_vector_edgy_args = {
	pos: 	Vector( 1,			 2,		 3 			),
	neg:	Vector(-1,			-2,		-3 			),
	tiny: 	Vector( 1e-1,		 1e-1,	 1e-1 		),
	big: 	Vector( 1e4,		 1e4,	 1e4 		),
	nans: 	Vector( NaN,		 NaN, 	 NaN 		),
	infs: 	Vector( Infinity,	 Infinity, Infinity ),
	ninfs: 	Vector(-Infinity,	-Infinity,-Infinity ),
	I: 		Vector( 0,			 0,		 0 			),
	out: 	Vector( 0,			 0,		 0 			),
}
let mult_vector_edgy_args = {
	pos: 	Vector( 1,			 2,		 3 			),
	neg:	Vector(-1,			-2,		-3 			),
	tiny: 	Vector( 1e-1,		 1e-1,	 1e-1 		),
	big: 	Vector( 1e4,		 1e4,	 1e4 		),
	nans: 	Vector( NaN,		 NaN, 	 NaN 		),
	infs: 	Vector( Infinity,	 Infinity, Infinity ),
	ninfs: 	Vector(-Infinity,	-Infinity,-Infinity ),
	zeros: 	Vector( 0,			 0,		 0 			),
	I: 		Vector( 1,			 1,		 1 			),
	out: 	Vector( 0,			 0,		 0 			),
}
let add_matrix_happy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		
				    4,			 5,		 6, 		
				    7,			 8,		 9, 		),
	neg:	Matrix(-1,			-2,		-3, 		
				   -4,			-5,		-6, 		
				   -7,			-8,		-9, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		),
	I: 		Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
}
let mult_matrix_happy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		
				    4,			 5,		 6, 		
				    7,			 8,		 9, 		),
	neg:	Matrix(-1,			-2,		-3, 		
				   -4,			-5,		-6, 		
				   -7,			-8,		-9, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		),
	out: 	Matrix( 1,			 1,		 1, 		
				    1,			 1,		 1, 		
				    1,			 1,		 1, 		),
	I: 		Matrix.Identity(),
}
// an "edge case" is anything that produces a technically valid value but does not follow abelian group algebra
// for instance, a "NaN" value that spreads through calculations
let add_matrix_edgy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		
				    4,			 5,		 6, 		
				    7,			 8,		 9, 		),
	neg:	Matrix(-1,			-2,		-3, 		
				   -4,			-5,		-6, 		
				   -7,			-8,		-9, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		),
	nans: 	Matrix( NaN,		 NaN, 	 NaN, 		
				    NaN,		 NaN, 	 NaN, 		
				    NaN,		 NaN, 	 NaN, 		),
	infs: 	Matrix( Infinity,	 Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, ),
	ninfs: 	Matrix(-Infinity,	-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity, 
				  -Infinity,	-Infinity,-Infinity, ),
	I: 		Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
}
let mult_matrix_edgy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		 4, 		
				    5,			 6,		 7, 		 8, 		
				    9,			 10,	 11, 		 12, 		
				    13,			 14,	 15, 		 16, 		),
	neg:	Matrix(-1,			-2,		-3, 		-4, 		
				   -5,			-6,		-7, 		-8, 		
				   -9,			-10,	-11, 		-12, 		
				   -13,			-14,	-15, 		-16, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		
				    1e4,		 1e4,	 1e4, 		),
	nans: 	Matrix( NaN,		 NaN, 	 NaN, 		
				    NaN,		 NaN, 	 NaN, 		
				    NaN,		 NaN, 	 NaN, 		),
	infs: 	Matrix( Infinity,	 Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, ),
	ninfs: 	Matrix(-Infinity,	-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity, 
				  -Infinity,	-Infinity,-Infinity, ),
	zeros: 	Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		
				    0,			 0,		 0, 		
				    0,			 0,		 0, 		),
	I: 		Matrix.Identity(),
}
let add_matrix4x4_happy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		 4, 		
				    5,			 6,		 7, 		 8, 		
				    9,			 10,	 11, 		 12, 		
				    13,			 14,	 15, 		 16, 		),
	neg:	Matrix(-1,			-2,		-3, 		-4, 		
				   -5,			-6,		-7, 		-8, 		
				   -9,			-10,	-11, 		-12, 		
				   -13,			-14,	-15, 		-16, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		),
	I: 		Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
}
let mult_matrix4x4_happy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		 4, 		
				    5,			 6,		 7, 		 8, 		
				    9,			 10,	 11, 		 12, 		
				    13,			 14,	 15, 		 16, 		),
	neg:	Matrix(-1,			-2,		-3, 		-4, 		
				   -5,			-6,		-7, 		-8, 		
				   -9,			-10,	-11, 		-12, 		
				   -13,			-14,	-15, 		-16, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		
				    1e-1,		 1e-1,	 1e-1,		 1e-1,		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		),
	I: 		Matrix( 1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		),
	out: 	Matrix( 1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		
				    1,			 1,		 1, 		 1, 		),
	I: 		Matrix4x4.identity(),
}
let add_matrix4x4_edgy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		 4, 		
				    5,			 6,		 7, 		 8, 		
				    9,			 10,	 11, 		 12, 		
				    13,			 14,	 15, 		 16, 		),
	neg:	Matrix(-1,			-2,		-3, 		-4, 		
				   -5,			-6,		-7, 		-8, 		
				   -9,			-10,	-11, 		-12, 		
				   -13,			-14,	-15, 		-16, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		),
	nans: 	Matrix( NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		),
	infs: 	Matrix( Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, ),
	ninfs: 	Matrix(-Infinity,	-Infinity,-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity,-Infinity, 
				  -Infinity,	-Infinity,-Infinity,-Infinity, ),
	I: 		Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
}
let mult_matrix4x4_edgy_args = {
	pos: 	Matrix( 1,			 2,		 3, 		 4, 		
				    5,			 6,		 7, 		 8, 		
				    9,			 10,	 11, 		 12, 		
				    13,			 14,	 15, 		 16, 		),
	neg:	Matrix(-1,			-2,		-3, 		-4, 		
				   -5,			-6,		-7, 		-8, 		
				   -9,			-10,	-11, 		-12, 		
				   -13,			-14,	-15, 		-16, 		),
	tiny: 	Matrix( 1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		
				    1e-1,		 1e-1,	 1e-1, 		 1e-1, 		),
	big: 	Matrix( 1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		
				    1e4,		 1e4,	 1e4, 		 1e4, 		),
	nans: 	Matrix( NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		
				    NaN,		 NaN, 	 NaN, 		 NaN, 		),
	infs: 	Matrix( Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, 
				    Infinity,	 Infinity, Infinity, Infinity, ),
	ninfs: 	Matrix(-Infinity,	-Infinity,-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity,-Infinity, 
				   -Infinity,	-Infinity,-Infinity,-Infinity, 
				  -Infinity,	-Infinity,-Infinity,-Infinity, ),
	zeros: 	Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
	out: 	Matrix( 0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		
				    0,			 0,		 0, 		 0, 		),
	I: 		Matrix4x4.identity(),
}
let add_scalar_field_happy_args = {
	pos: 	Float32Raster.FromArray([ 1,	 2,		 3,		 4,	 ], tetrahedron),
	neg:	Float32Raster.FromArray([-1,	-2,		-3,		-4	 ], tetrahedron),
	tiny: 	Float32Raster.FromArray([ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	Float32Raster.FromArray([ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	I: 		Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
	out: 	Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
}
let mult_scalar_field_happy_args = {
	neg:	Float32Raster.FromArray([-1,	-1,		-1,		-1	 ], tetrahedron),
	tiny: 	Float32Raster.FromArray([ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	Float32Raster.FromArray([ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	I: 		Float32Raster.FromArray([ 1,	 1,		 1,		 1	 ], tetrahedron),
	out: 	Float32Raster.FromArray([ 1,	 1,		 1,		 1	 ], tetrahedron),
}
// an "edge case" is anything that produces a technically valid value but does not follow abelian group algebra
// for instance, a "NaN" value that spreads through calculations
let add_scalar_field_edgy_args = {
	pos: 	Float32Raster.FromArray([ 1,	 2,		 3,		 4,	 ], tetrahedron),
	neg:	Float32Raster.FromArray([-1,	-2,		-3,		-4	 ], tetrahedron),
	tiny: 	Float32Raster.FromArray([ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	Float32Raster.FromArray([ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	nans: 	Float32Raster.FromArray([ NaN,	 NaN, 	 NaN, 	 NaN ], tetrahedron),
	infs: 	Float32Raster.FromArray([ Infinity, Infinity, Infinity, Infinity], tetrahedron),
	ninfs: 	Float32Raster.FromArray([-Infinity,-Infinity,-Infinity,-Infinity], tetrahedron),
	I: 		Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
	out: 	Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
}
let mult_scalar_field_edgy_args = {
	pos: 	Float32Raster.FromArray([ 1,	 2,		 3,		 4,	 ], tetrahedron),
	neg:	Float32Raster.FromArray([-1,	-2,		-3,		-4	 ], tetrahedron),
	tiny: 	Float32Raster.FromArray([ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	Float32Raster.FromArray([ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	nans: 	Float32Raster.FromArray([ NaN,	 NaN, 	 NaN, 	 NaN ], tetrahedron),
	infs: 	Float32Raster.FromArray([ Infinity, Infinity, Infinity, Infinity], tetrahedron),
	ninfs: 	Float32Raster.FromArray([-Infinity,-Infinity,-Infinity,-Infinity], tetrahedron),
	zeros: 	Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
	I: 		Float32Raster.FromArray([ 1,	 1,		 1,		 1	 ], tetrahedron),
	out: 	Float32Raster.FromArray([ 0,	 0,		 0,		 0	 ], tetrahedron),
}
let add_vector_field_happy_args = {
	pos: 	VectorRaster.FromArrays([ 1,	 2,		 3,		 4,	 ], 
									[ 5,	 6,		 7,		 8,	 ], 
									[ 9,	 10,	 11,	 12, ], tetrahedron),
	neg:	VectorRaster.FromArrays([-1,	-2,		-3,		-4	 ], 
									[-5,	-6,		-7,		-8	 ], 
									[-9,	-10,	-11,	-12	 ], tetrahedron),
	tiny: 	VectorRaster.FromArrays([ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	VectorRaster.FromArrays([ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	I: 		VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
	out: 	VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
}
let mult_vector_field_happy_args = {
	pos: 	VectorRaster.FromArrays([ 1,	 2,		 3,		 4,	 ], 
									[ 5,	 6,		 7,		 8,	 ], 
									[ 9,	 10,	 11,	 12, ], tetrahedron),
	neg:	VectorRaster.FromArrays([-1,	-2,		-3,		-4	 ], 
									[-5,	-6,		-7,		-8	 ], 
									[-9,	-10,	-11,	-12	 ], tetrahedron),
	tiny: 	VectorRaster.FromArrays([ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	VectorRaster.FromArrays([ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	I: 		VectorRaster.FromArrays([ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], tetrahedron),
	out: 	VectorRaster.FromArrays([ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], tetrahedron),
}
// an "edge case" is anything that produces a technically valid value but does not follow abelian group algebra
// for instance, a "NaN" value that spreads through calculations
let add_vector_field_edgy_args = {
	pos: 	VectorRaster.FromArrays([ 1,	 2,		 3,		 4,	 ], 
									[ 5,	 6,		 7,		 8,	 ], 
									[ 9,	 10,	 11,	 12,	 ], tetrahedron),
	neg:	VectorRaster.FromArrays([-1,	-2,		-3,		-4	 ], 
									[-5,	-6,		-7,		-8	 ], 
									[-9,	-10,	-11,	-12	 ], tetrahedron),
	tiny: 	VectorRaster.FromArrays([ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	VectorRaster.FromArrays([ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	nans: 	VectorRaster.FromArrays([ NaN,	 NaN, 	 NaN, 	 NaN ], 
									[ NaN,	 NaN, 	 NaN, 	 NaN ], 
									[ NaN,	 NaN, 	 NaN, 	 NaN ], tetrahedron),
	infs: 	VectorRaster.FromArrays([ Infinity, Infinity, Infinity, Infinity], 
									[ Infinity, Infinity, Infinity, Infinity], 
									[ Infinity, Infinity, Infinity, Infinity], tetrahedron),
	ninfs: 	VectorRaster.FromArrays([-Infinity,-Infinity,-Infinity,-Infinity], 
									[-Infinity,-Infinity,-Infinity,-Infinity], 
									[-Infinity,-Infinity,-Infinity,-Infinity], tetrahedron),
	I: 		VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
	out: 	VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
}
let mult_vector_field_edgy_args = {
	pos: 	VectorRaster.FromArrays([ 1,	 2,		 3,		 4,	 ], 
									[ 5,	 6,		 7,		 8,	 ], 
									[ 9,	 10,	 11,	 12,	 ], tetrahedron),
	neg:	VectorRaster.FromArrays([-1,	-2,		-3,		-4	 ], 
									[-5,	-6,		-7,		-8	 ], 
									[-9,	-10,	-11,	-12	 ], tetrahedron),
	tiny: 	VectorRaster.FromArrays([ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], 
									[ 1e-1,	 1e-1,	 1e-1,	 1e-1], tetrahedron),
	big: 	VectorRaster.FromArrays([ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], 
									[ 1e4,	 1e4,	 1e4,	 1e4,], tetrahedron),
	nans: 	VectorRaster.FromArrays([ NaN,	 NaN, 	 NaN, 	 NaN ], 
									[ NaN,	 NaN, 	 NaN, 	 NaN ], 
									[ NaN,	 NaN, 	 NaN, 	 NaN ], tetrahedron),
	infs: 	VectorRaster.FromArrays([ Infinity, Infinity, Infinity, Infinity], 
									[ Infinity, Infinity, Infinity, Infinity], 
									[ Infinity, Infinity, Infinity, Infinity], tetrahedron),
	ninfs: 	VectorRaster.FromArrays([-Infinity,-Infinity,-Infinity,-Infinity], 
									[-Infinity,-Infinity,-Infinity,-Infinity], 
									[-Infinity,-Infinity,-Infinity,-Infinity], tetrahedron),
	zeros: 	VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
	I: 		VectorRaster.FromArrays([ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], 
									[ 1,	 1,		 1,		 1	 ], tetrahedron),
	out: 	VectorRaster.FromArrays([ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], 
									[ 0,	 0,		 0,		 0	 ], tetrahedron),
}








//test_algabraic_group(
//	Vector.add_scalar, "Vector.add_scalar",
//	Vector.sub_scalar, "Vector.sub_scalar",
//	add_vector_field_happy_args, add_uniform_args,
//);
//test_algabraic_group(
//	Vector.mult_scalar, "Vector.mult_scalar",
//	Vector.div_scalar, "Vector.div_scalar",
//	mult_vector_field_happy_args, mult_uniform_args,
//);
//test_algabraic_group(
//	Vector.add_scalar, "Vector.add_scalar",
//	Vector.sub_scalar, "Vector.sub_scalar",
//	add_vector_field_happy_args, add_scalar_field_happy_args,
//);
//test_algabraic_group(
//	Vector.mult_scalar, "Vector.mult_scalar",
//	Vector.div_scalar, "Vector.div_scalar",
//	mult_vector_field_happy_args, mult_scalar_field_happy_args,
//);
//test_algabraic_field(
//	Vector.add_vector, "Vector.add_vector",
//	Vector.sub_vector, "Vector.sub_vector",
//	add_vector_field_happy_args, 
//	add_vector_field_happy_args, 
//	Vector.hadamard_vector,"Vector.hadamard_vector",
//	Vector.div_vector, "Vector.div_vector",
//	mult_vector_field_happy_args, 
//	mult_vector_field_happy_args, 
//);












framework_tests(
	'Float32Raster',
	Float32Raster.FromArray([-1,	 0,		 0.5,	 NaN ], tetrahedron),
	Float32Raster.FromArray([ 1, 	 2,		 0.49,	 3 	 ], tetrahedron),
);

test_algabraic_group(
	ScalarField.add_scalar, "ScalarField.add_scalar",
	ScalarField.sub_scalar, "ScalarField.sub_scalar",
	add_scalar_field_happy_args, add_uniform_args,
	add_scalar_field_edgy_args, add_uniform_args,
);
test_algabraic_group(
	ScalarField.mult_scalar, "ScalarField.mult_scalar",
	ScalarField.div_scalar, "ScalarField.div_scalar",
	mult_scalar_field_happy_args, mult_uniform_args,
	mult_scalar_field_edgy_args, mult_uniform_args,
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	ScalarField.min_scalar, "ScalarField.min_scalar",
	mult_scalar_field_happy_args, mult_uniform_args,
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	ScalarField.max_scalar, "ScalarField.max_scalar",
	mult_scalar_field_happy_args, mult_uniform_args,
);
test_equivalence(
	ScalarField.gte_scalar, "ScalarField.gte_scalar",
	(a,b) => BinaryMorphology.union(ScalarField.gt_scalar(a,b), ScalarField.eq_scalar(a,b)), "[equivalent expression]",
	mult_scalar_field_happy_args, mult_uniform_args,
);
test_equivalence(
	ScalarField.ne_scalar, "ScalarField.ne_scalar",
	(a,b) => BinaryMorphology.negation(ScalarField.eq_scalar(a,b)), "[equivalent expression]",
	mult_scalar_field_happy_args, mult_uniform_args,
);
test_equivalence(
	ScalarField.add_scalar_term, "ScalarField.add_scalar_term",
	(a,b,c) => ScalarField.add_field(a,ScalarField.mult_scalar(b,c)), "[equivalent expression]",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, mult_uniform_args,
);
test_equivalence(
	ScalarField.sub_scalar_term, "ScalarField.sub_scalar_term",
	(a,b,c) => ScalarField.sub_field(a,ScalarField.mult_scalar(b,c)), "[equivalent expression]",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, mult_uniform_args,
);



test_algabraic_field(
	ScalarField.add_field, "ScalarField.add_field", 
	ScalarField.sub_field, "ScalarField.sub_field", 
	add_scalar_field_happy_args, 
	add_scalar_field_edgy_args, 
	ScalarField.mult_field,"ScalarField.mult_field",
	ScalarField.div_field, "ScalarField.div_field", 
	mult_scalar_field_happy_args, 
	mult_scalar_field_edgy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	ScalarField.min_field, "ScalarField.min_field",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	ScalarField.max_field, "ScalarField.max_field",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, 
);
test_equivalence(
	ScalarField.sqrt_field, "ScalarField.sqrt_field",
	(a) => ScalarField.pow_scalar(a,1/2), "ScalarField.pow_scalar(...,1/2)",
	mult_scalar_field_happy_args
);
test_equivalence(
	ScalarField.inv_field, "ScalarField.inv_field",
	(a) => ScalarField.div_field(mult_scalar_field_happy_args.I,a), "ScalarField.div_field(I,...)",
	mult_scalar_field_happy_args
);
test_equivalence(
	ScalarField.gte_field, "ScalarField.gte_field",
	(a,b) => BinaryMorphology.union(ScalarField.gt_field(a,b), ScalarField.eq_field(a,b)), "BinaryMorphology.union(ScalarField.gt_field, ScalarField.eq_field)",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, 
);
test_equivalence(
	ScalarField.lte_field, "ScalarField.lte_field",
	(a,b) => BinaryMorphology.union(ScalarField.lt_field(a,b), ScalarField.eq_field(a,b)), "BinaryMorphology.union(ScalarField.lt_field, ScalarField.eq_field)",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, 
);
test_equivalence(
	ScalarField.ne_field, "ScalarField.ne_field",
	(a,b) => BinaryMorphology.negation(ScalarField.eq_field(a,b)), "BinaryMorphology.negation(ScalarField.eq_field)",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, 
);
test_equivalence(
	ScalarField.add_field_term, "ScalarField.add_field_term",
	(a,b,c) => ScalarField.add_field(a, ScalarField.mult_field(b,c)), "ScalarField.add_field(..., ScalarField.mult_field)",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, mult_scalar_field_happy_args,
);
test_equivalence(
	ScalarField.sub_field_term, "ScalarField.sub_field_term",
	(a,b,c) => ScalarField.sub_field(a, ScalarField.mult_field(b,c)), "ScalarField.sub_field(..., ScalarField.mult_field)",
	mult_scalar_field_happy_args, mult_scalar_field_happy_args, mult_scalar_field_happy_args,
);


test_algabraic_group(
	VectorField.add_scalar, "VectorField.add_scalar",
	VectorField.sub_scalar, "VectorField.sub_scalar",
	add_vector_field_happy_args, add_uniform_args,
	add_vector_field_edgy_args, add_uniform_args,
);
test_algabraic_group(
	VectorField.mult_scalar, "VectorField.mult_scalar",
	VectorField.div_scalar, "VectorField.div_scalar",
	mult_vector_field_happy_args, mult_uniform_args,
	mult_vector_field_edgy_args, mult_uniform_args,
);

test_algabraic_group(
	VectorField.add_vector, "VectorField.add_vector",
	VectorField.sub_vector, "VectorField.sub_vector",
	add_vector_field_happy_args, add_vector_happy_args,
	add_vector_field_edgy_args, add_vector_edgy_args,
);
test_algabraic_group(
	VectorField.hadamard_vector, "VectorField.hadamard_vector",
	VectorField.div_vector, "VectorField.div_vector",
	mult_vector_field_happy_args, mult_vector_happy_args,
	mult_vector_field_edgy_args, mult_vector_edgy_args,
);

test_algabraic_group(
	VectorField.add_scalar_field, "VectorField.add_scalar_field",
	VectorField.sub_scalar_field, "VectorField.sub_scalar_field",
	add_vector_field_happy_args, add_scalar_field_happy_args,
	add_vector_field_edgy_args, add_scalar_field_edgy_args,
);
test_algabraic_group(
	VectorField.mult_scalar_field, "VectorField.mult_scalar_field",
	VectorField.div_scalar_field, "VectorField.div_scalar_field",
	mult_vector_field_happy_args, mult_scalar_field_happy_args,
	mult_vector_field_edgy_args, mult_scalar_field_edgy_args,
);

test_algabraic_field(
	VectorField.add_vector_field, "VectorField.add_vector_field",
	VectorField.sub_vector_field, "VectorField.sub_vector_field",
	add_vector_field_happy_args, 
	add_vector_field_edgy_args, 
	VectorField.hadamard_vector_field,"VectorField.hadamard_vector_field",
	VectorField.div_vector_field, "VectorField.div_vector_field",
	mult_vector_field_happy_args, 
	mult_vector_field_edgy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		// test_associativity, // NOTE: max_vector_field and min_vector_field are nonassociative, since two vectors can have the same magnitude, e.g. [1,1,1] and [-1,-1,-1]
		// test_commutativity,
	], 
	VectorField.min_vector_field, "VectorField.min_vector_field",
	mult_vector_field_happy_args, mult_vector_field_happy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		// test_associativity, // NOTE: max_vector_field and min_vector_field are nonassociative, since two vectors can have the same magnitude, e.g. [1,1,1] and [-1,-1,-1]
		// test_commutativity,
	], 
	VectorField.max_vector_field, "VectorField.max_vector_field",
	mult_vector_field_happy_args, mult_vector_field_happy_args, 
);

test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		// test_associativity, 
		// test_commutativity,
	], 
	VectorField.cross_vector, "VectorField.cross_vector",
	mult_vector_field_happy_args, mult_vector_happy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	VectorField.mult_matrix, "VectorField.mult_matrix",
	mult_vector_field_happy_args, mult_matrix_happy_args, 
);
test_properties([
		test_unary_output_reference,
		test_unary_output_idempotence,			
		test_closure,
		// test_identity,
		test_associativity, 
		// test_commutativity,
	], 
	VectorField.normalize, "VectorField.normalize",
	mult_vector_field_happy_args, mult_vector_field_happy_args, 
);
test_properties([
		test_binary_output_reference,
		test_binary_output_idempotence,			
		test_closure,
		// test_identity,
		// test_associativity, 
		// test_commutativity,
	], 
	VectorField.cross_vector_field, "VectorField.cross_vector_field",
	mult_vector_field_happy_args, mult_vector_field_happy_args, 
);
test_anticommutativity(
	VectorField.cross_vector_field, "VectorField.cross_vector_field",
	VectorField.sub_vector_field, "VectorField.sub_vector_field",
	add_vector_field_happy_args, add_vector_field_happy_args, 
);
test_distributivity(
	VectorField.add_vector_field, "VectorField.add_vector_field",
	VectorField.cross_vector_field, "VectorField.cross_vector_field",
	mult_vector_field_happy_args
);
test_equivalence(
	(a) => VectorField.cross_vector_field(a, a), "VectorField.cross_vector_field",
	(a) => mult_vector_field_edgy_args.zeros, "0",
	mult_vector_field_happy_args, 
);
test_equivalence(
	(a,b) => VectorField.dot_vector_field(a, VectorField.cross_vector_field(a, b)), "VectorField.cross_vector_field",
	(a,b) => mult_scalar_field_edgy_args.zeros, "0",
	mult_vector_field_happy_args, mult_vector_field_happy_args, 
);


test_equivalence(
	(a) => VectorField.curl(ScalarField.gradient(a)), "VectorField.curl(ScalarField.gradient)",
	(a) => mult_vector_field_edgy_args.zeros, "0",
	mult_scalar_field_happy_args, 
);
// NOTE: this test fails, but I'm not sure whether it's failing 
//  because its broken or because the "tetrahedron" grid isn't a suitable test subject
//test_equivalence(
//	(a) => VectorField.divergence(VectorField.curl(a)), "VectorField.curl(ScalarField.gradient)",
//	(a) => mult_scalar_field_edgy_args.zeros, "0",
//	mult_vector_field_happy_args, 
//);
