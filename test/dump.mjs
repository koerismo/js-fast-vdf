import { KeyVRoot } from '../dist/index.js';
import assert from 'node:assert';

const test_indent = new KeyVRoot().factory()
	.pair('abc', 'def')
	.dir('a b c')
		.dir('d e f')
			.pair('xyz', '123', 'EASY')
			.back()
		.back()
	.exit();

const test_escape = new KeyVRoot().factory()
	.pair('abc', 'def')
	.pair('a b c', 'd e f')
	.pair('a"b"c', 'def\\')
	.dir('dir')
		.pair('xyz', '[123]')
		.pair('123', 123)
		.back()
	.exit();

describe('Object', () => {

it('Dumps structures with correct indentation', () => {
const dumpy = test_indent.dump({ quote: 'always', indent: '> ' });
assert.strictEqual(dumpy,
`"abc" "def"
"a b c"
{
> "d e f"
> {
> > "xyz" "123" [EASY]
> }
}
`);
});


it('Escapes quoted values', () => {
const dumpy = test_escape.dump({ quote: 'always', indent: '\t' });
assert.strictEqual(dumpy,
`"abc" "def"
"a b c" "d e f"
"a\\"b\\"c" "def\\\\"
"dir"
{
	"xyz" "[123]"
	"123" 123
}
`);
});


it('Escapes unquoted values', () => {
const dumpy = test_escape.dump({ quote: 'auto', indent: '\t' });
assert.strictEqual(dumpy,
`abc def
"a b c" "d e f"
a\\"b\\"c def\\\\
dir
{
	xyz "[123]"
	123 123
}
`);
});


});