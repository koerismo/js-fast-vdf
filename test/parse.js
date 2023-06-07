import assert from 'node:assert';
import { vdf, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

describe('Parser', () => {
	it('Handles escapes', () => {

		assert.deepStrictEqual(
			vdf.parse(`
				"hello\\" \\"world" value
				escaped\\ key value
				"escaped escape\\\\" value`)
				.all(),
			new KeyVRoot()
				.add(new KeyV('hello\\" \\"world', 'value'))
				.add(new KeyV('escaped\\ key', 'value'))
				.add(new KeyV('escaped escape\\\\', 'value'))
				.all()
		);
	});

	it('Parses basic keyvalues', () => {
		assert.deepStrictEqual(
			vdf.parse(`
				"hello" "world" [QUERY]
				"spaced key" "spaced value"
				hello world
				"[QUERYISH_KEY]" unquoted.value`).all(),
			new KeyVRoot()
				.add(new KeyV('hello', 'world', 'QUERY'))
				.add(new KeyV('spaced key', 'spaced value'))
				.add(new KeyV('hello', 'world'))
				.add(new KeyV('[QUERYISH_KEY]', 'unquoted.value'))
				.all()
		);
	});

	it('Parses nested structures', () => {
		assert.deepStrictEqual(
			vdf.parse(`
			key1 {
				key2 value1
				key3 {
					key4 {
						key5 value2
					}
					key6 value3
				}
			}`).all(),
			new KeyVRoot()
				.add(new KeyVSet('key1')
					.add(new KeyV('key2', 'value1'))
					.add(new KeyVSet('key3')
						.add(new KeyVSet('key4')
							.add(new KeyV('key5', 'value2'))
						)
						.add(new KeyV('key6', 'value3'))
					)
				).all()
		);
	});
});