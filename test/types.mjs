import assert from 'node:assert';
import { vdf, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

const input = `123 "456"
123 456
true "true"
false false
`;

const output_auto = `123 456
123 456
true true
false false
`;

const output_auto_typed = `123 "456"
123 456
true "true"
false false
`;

const output_always = `"123" "456"
"123" 456
"true" "true"
"false" false
`;

const expected_parse = new KeyVRoot().factory()
	.pair('123', '456')
	.pair('123', 456)
	.pair('true', 'true')
	.pair('false', false)
	.exit();

describe('Types', () => {
	it('Parses typed input', () => {
		assert.deepStrictEqual(vdf.parse(input, { types: true }).pairs(), expected_parse.pairs());
	});

	it('Dumps always-quoted typed output', () => {
		assert.strictEqual(vdf.parse(input, { types: true }).dump({ quote: 'always' }), output_always);
	});

	it('Dumps auto-quoted typed output', () => {
		assert.strictEqual(vdf.parse(input, { types: true }).dump({ quote: 'auto' }), output_auto);
	});

	it('Dumps auto-type-quoted typed output', () => {
		assert.strictEqual(vdf.parse(input, { types: true }).dump({ quote: 'auto-typed' }), output_auto_typed);
	});
});

describe('KeyV', () => {
	it('Correctly coerces values', () => {
		// Booleans
		assert.strictEqual(new KeyV('', 'true').bool(),  true);
		assert.strictEqual(new KeyV('', 'on').bool(),    true);
		assert.strictEqual(new KeyV('', '1').bool(),     true);
		assert.strictEqual(new KeyV('', 'false').bool(), false);
		assert.strictEqual(new KeyV('', 'off').bool(),   false);
		assert.strictEqual(new KeyV('', '0').bool(),     false);

		// Numbers
		assert.strictEqual(new KeyV('', '1.234').float(), 1.234);
		assert.strictEqual(new KeyV('', '1.234').int(),   1);
		assert.strictEqual(new KeyV('', 'nada').float(8), 8);
		assert.strictEqual(new KeyV('', 'nada').int(8),   8);
		assert.throws(() => new KeyV('', 'nada').float());
		assert.throws(() => new KeyV('', 'nada').int());
		
		// Vectors
		assert.deepStrictEqual(new KeyV('', '[1.0 0.5 0.25]').vector(), new Float64Array([1.0, 0.5, 0.25]));
		assert.deepStrictEqual(new KeyV('', '{1.0 0.5 0.25}').vector(undefined, '{', '}'), new Float64Array([1.0, 0.5, 0.25]));
		assert.deepStrictEqual(new KeyV('', '1.0 0.5 0.25').vector(undefined, '', ''), new Float64Array([1.0, 0.5, 0.25]));
		assert.deepStrictEqual(new KeyV('', 'nada').vector([1.0, 2.0]), [1.0, 2.0]);
		assert.throws(() => new KeyV('', 'nada').vector());
	});
});