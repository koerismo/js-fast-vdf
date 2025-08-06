import assert from 'node:assert';
import { parse, json, KeyVRoot, KeyVSet, KeyV, type ValueType, type JsonSet } from '../dist/index.js';

// function flat(a: TemplateStringsArray) {
// 	return a.join('').split('\n').map(x => x.trimStart()).join('\n');
// }

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

	it('Uses #macro handler', () => {
		const macro_test = `
			"abc" "def"
			#hello world
		`;

		assert.deepStrictEqual(
			parse(macro_test, { on_macro: undefined }).all(),
			new KeyVRoot()
				.add(new KeyV('abc', 'def'))
				.add(new KeyV('#hello', 'world')).all()
		);
	
		assert.deepStrictEqual(
			json(macro_test, { on_macro: undefined }),
			{ 'abc': 'def', '#hello': 'world' }
		);

		let called_keyv = false;
		const on_macro_keyv = (key: string, value: ValueType, context: KeyVSet | KeyVRoot) => {
			assert.strictEqual(key, '#hello');
			assert.strictEqual(value, 'world');
			called_keyv = true;
		}

		let called_json = false;
		const on_macro_json = (key: string, value: ValueType, context: JsonSet) => {
			assert.strictEqual(key, '#hello');
			assert.strictEqual(value, 'world');
			called_json = true;
		}

		assert.deepStrictEqual(
			parse(macro_test, { on_macro: on_macro_keyv }).all(),
			new KeyVRoot().add(new KeyV('abc', 'def')).all()
		);

		assert.deepStrictEqual(
			json(macro_test, { on_macro: on_macro_json }),
			{ 'abc': 'def' }
		);

		assert(called_keyv, 'Macro handler not called in KeyV handler!');
		assert(called_json, 'Macro handler not called in json handler!');
	});

	it('Uses [query] handler', () => {
		const query_test = `
			"no" "query"
			"abc" "def" [123]
			"hello" "world" [456]
		`;

		assert.deepStrictEqual(
			parse(query_test, { on_query: undefined }).all(),
			new KeyVRoot()
				.add(new KeyV('no', 'query'))
				.add(new KeyV('abc', 'def', '123'))
				.add(new KeyV('hello', 'world', '456')).all()
		);
	
		assert.deepStrictEqual(
			json(query_test, { on_query: undefined }),
			{ 'no': 'query', 'abc': 'def', 'hello': 'world' }
		);

		let called = 0;
		const on_query = (query: string) => {
			called++;
			if (query === '456') return false;
			return true;
		}

		assert.deepStrictEqual(
			parse(query_test, { on_query: on_query }).all(),
			new KeyVRoot()
				.add(new KeyV('no', 'query'))
				.add(new KeyV('abc', 'def', '123')).all()
		);

		assert.deepStrictEqual(
			json(query_test, { on_query: on_query }),
			{ 'no': 'query', 'abc': 'def' }
		);

		assert.equal(called, 4, 'Expected query handler to be called 4x!');
	});
});