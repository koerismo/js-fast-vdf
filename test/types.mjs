import assert from 'node:assert';
import { vdf, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

const input = `123 "456"
123 456
true "true"
false false
`;

const input_quoted = `"123" "456"
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
		assert.deepStrictEqual(vdf.parse(input).pairs(), expected_parse.pairs());
	});

	it('Dumps always-quoted typed output', () => {
		assert.strictEqual(vdf.parse(input).dump({ quote: 'always' }), input_quoted);
	});

	it('Dumps auto-quoted typed output', () => {
		assert.strictEqual(vdf.parse(input).dump({ quote: 'auto' }), input);
	});
});