import assert from 'node:assert';
import { parse, KeyVRoot, KeyV } from '../dist/index.js';
import { escape, unescape, DumpQuotationType } from '../dist/types.js';

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

describe('Types: Parsing', () => {
	it('Parses typed input', () => {
		assert.deepStrictEqual(parse(input, { types: true }).pairs(), expected_parse.pairs());
	});

	it('Dumps always-quoted typed output', () => {
		assert.strictEqual(parse(input, { types: true }).dump({ quote: DumpQuotationType.Always }), output_always);
	});

	it('Dumps auto-quoted typed output', () => {
		assert.strictEqual(parse(input, { types: true }).dump({ quote: DumpQuotationType.Auto }), output_auto);
	});

	it('Dumps auto-type-quoted typed output', () => {
		assert.strictEqual(parse(input, { types: true }).dump({ quote: DumpQuotationType.AutoTyped }), output_auto_typed);
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

describe('Escapes', () => {
	it('Determines quotedness', () => {
		for (const [unescaped, escaped, should_quote] of [
			['abc',			'abc',			false],
			['\\a\\bc',		'\\\\a\\\\bc',	false],
			['\na\tb',		'\\na\\tb',		false],
			['"abc"',		'\\"abc\\"',	false],
			['\n\t',		'\\n\\t',		false],
			['\n\t ',		'"\\n\\t "',	true],
			['[amogus]',	'"[amogus]"',	true],
		] as [string, string, boolean][]) {

			const conv_escaped = escape(unescaped, { escapes: true, quote: DumpQuotationType.Auto, indent: '\t' }, false);
			const conv_unescaped = unescape(should_quote ? escaped.slice(1, -1) : escaped);

			assert((conv_escaped[0] === '"') === should_quote, `Expected quotes=${should_quote}, but got ${!should_quote} on string "${unescape}"`);
			assert.equal(escaped, conv_escaped, `standard --> escaped FAILED! for string "${unescaped}"`);
			assert.equal(unescaped, conv_unescaped, `escaped --> standard FAILED! for string "${escaped}"`);
		
		}
	});

	it('Rejects invalid keys', () => {
		assert.throws(() => {
			escape('so-called "escapes"', { escapes: false, indent: '\t', quote: DumpQuotationType.Auto }, true);
		}, 'Expected quotation rejection when escapes are disabled!');
		assert.strictEqual(
			escape('so-called "escapes"', { escapes: true, indent: '\t', quote: DumpQuotationType.Auto }, true),
			'"so-called \\"escapes\\""'
		, 'Expected valid escaped string!');
	});

})