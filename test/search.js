import assert from 'node:assert';
import { vdf, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

const root = new KeyVRoot()
		.add(new KeyVSet('hello')
				.add(new KeyV('A', 'B'))
				.add(new KeyV('C', 'D'))
				.add(new KeyV('E', 'F'))
			)
		.add(new KeyV('example', 'these'))
		.add(new KeyVSet('world')
				.add(new KeyV('1', '2'))
				.add(new KeyV('3', '4'))
				.add(new KeyV('5', '6'))
			)
		.add(new KeyV('key', 'exist'))
		.add(new KeyV('key', 'too'))
		.add(new KeyVSet('key')
				.add(new KeyV('test', 'test'))
			);


describe('Classes', () => {

	it('Create structures reliably', () => {
		const root2 = new KeyVRoot().factory()
			.dir('hello')
				.pair('A', 'B')
				.pair('C', 'D')
				.pair('E', 'F')
				.back()
			.pair('example', 'these')
			.dir('world')
				.pair('1', '2')
				.pair('3', '4')
				.pair('5', '6')
				.back()
			.pair('key', 'exist')
			.pair('key', 'too')
			.dir('key')
				.pair('test', 'test')
				.back()
			.exit();

		assert.deepStrictEqual(root2, root);
	});

	it('Searches children reliably', () => {
		const children = root.all();

		assert.strictEqual(root.any('world'),		children[2]);

		assert.strictEqual(root.dir('hello'),		children[0]);
		assert.strictEqual(root.dir('key'),			children[5]);
		assert.deepStrictEqual(root.dirs(),			[children[0], children[2], children[5]]);

		assert.strictEqual(root.pair('example'),	children[1]);
		assert.strictEqual(root.pair('key'),		children[4]);
		assert.deepStrictEqual(root.pairs(),		[children[1], children[3], children[4]]);

		assert.deepStrictEqual(root.dirs('nada'),  []);
		assert.deepStrictEqual(root.pairs('nada'),  []);

		assert.strictEqual(root.dir('nada', null),  null);
		assert.strictEqual(root.pair('nada', null),  null);

		assert.throws(() => root.dir('nada'));
		assert.throws(() => root.pair('nada'));
	})
});