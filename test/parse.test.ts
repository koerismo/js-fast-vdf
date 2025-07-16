import assert from 'node:assert';
import { parse, json, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

describe('Parser', () => {

	it('Handles escapes', () => {
		assert.deepStrictEqual(
			parse(`
				"hello\\" \\"world" value
				escaped\\ key value
				"escaped escape\\\\" value`, { escapes: true })
				.all(),
			new KeyVRoot()
				.add(new KeyV('hello" "world', 'value'))
				.add(new KeyV('escaped\\ key', 'value'))
				.add(new KeyV('escaped escape\\', 'value'))
				.all()
		);
	});

	it('Responds to escape parameter', () => {
		assert.deepStrictEqual(
			parse(`
				"hello\\" "world" [query]
				key\\ "path\\to\\some\\place\\"`, { escapes: false })
				.all(),
			new KeyVRoot()
				.add(new KeyV('hello\\', 'world', 'query'))
				.add(new KeyV('key\\', 'path\\to\\some\\place\\'))
				.all()
		);
	});

	it('Parses basic keyvalues', () => {
		assert.deepStrictEqual(
			parse(`
				"hello" "world" [QUERY] // Ignore "this" [comment]
				"spaced key" "spaced value"
				hello 123
				"[QUERYISH_KEY]" unquoted.value`).all(),
			new KeyVRoot()
				.add(new KeyV('hello', 'world', 'QUERY'))
				.add(new KeyV('spaced key', 'spaced value'))
				.add(new KeyV('hello', '123'))
				.add(new KeyV('[QUERYISH_KEY]', 'unquoted.value'))
				.all()
		);
	});

	it('Parses multiline comments when specified', () => {
		assert.deepStrictEqual(parse(`
				"hello" "world"
				"key" /* multiline
				comments are very acceptable */
				"value"`, { multilines: true }).all(),
			new KeyVRoot()
				.add(new KeyV('hello', 'world'))
				.add(new KeyV('key', 'value'))
				.all());

		assert.throws(() => parse(`
			"hello" "world"
			"key" /* multiline
			comments are never acceptable */
			"value"`, { multilines: false }));
	});

	it('Parses nested structures', () => {
		assert.deepStrictEqual(
			parse(`
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

	it('Parses to JSON', () => {
		assert.deepStrictEqual(
			json(`
			key1 {
				key2 value1
				key3 {
					key4 {
						key5 value2
					}
					key6 value3
				}
			}`),
			{
				'key1': {
					'key2': 'value1',
					'key3': {
						'key4': {
							'key5': 'value2'
						},
						'key6': 'value3'
					}
				}
			}
		);
	});
});