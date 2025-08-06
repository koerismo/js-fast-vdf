import assert from 'node:assert';
import { KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

const root = new KeyVRoot().factory()
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
				.exit();


describe('Types: Editing', () => {

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
		assert.strictEqual(root.any('key'),			children[5]);
		assert.deepStrictEqual(root.dirs(),			[children[0], children[2], children[5]]);

		assert.strictEqual(root.pair('example'),	children[1]);
		assert.strictEqual(root.pair('key'),		children[4]);
		assert.strictEqual(root.value('example'),	children[1].value);
		assert.strictEqual(root.value('key'),		children[4].value);
		assert.deepStrictEqual(root.pairs(),		[children[1], children[3], children[4]]);

		assert.deepStrictEqual(root.dirs('nada'),  []);
		assert.deepStrictEqual(root.pairs('nada'),  []);
		assert.deepStrictEqual(root.all('nada'),  []);

		assert.strictEqual(root.dir('nada', null),  null);
		assert.strictEqual(root.pair('nada', null),  null);
		assert.strictEqual(root.any('nada', null),  null);
		assert.strictEqual(root.value('nada', null),  null);

		assert.throws(() => root.dir('nada'));
		assert.throws(() => root.pair('nada'));
		assert.throws(() => root.any('nada'));
		assert.throws(() => root.value('nada'));
	});

	it('Deletes children correctly', () => {
		const children = root.all();
		const root2 = new KeyVRoot().insert(children);
		assert.deepStrictEqual(root2.all(), root.all(), 'Expected constructor to insert values!');

		// Slow deletion - keeps order, but is slower
		assert.strictEqual(root2.delete(root2.any('key')), true);
		assert.deepStrictEqual(root2.all(), children.slice(0, -1));
		
		assert.strictEqual(root2.delete(root2.any('example')), true);
		assert.deepStrictEqual(root2.all(), [ children[0], children[2], children[3], children[4] ]);
	
		// Fast deletion - destroys order, but is faster
		assert.strictEqual(root2.delete(root2.dir('world'), true), true);
		assert.deepStrictEqual(root2.all(), [ children[0], children[4], children[3],  ]);

		// Delete returns false if the key is not a member
		const invalidKV = new KeyV('k', 'v');
		assert.strictEqual(root2.delete(invalidKV), false);
		assert.strictEqual(root2.delete(invalidKV, true), false);
	});
});