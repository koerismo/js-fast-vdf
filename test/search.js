import assert from 'node:assert';
import { vdf, KeyVRoot, KeyVSet, KeyV } from '../dist/index.js';

describe('Classes', () => {

	it('Searches for keyvalues', () => {
		assert.deepStrictEqual(
			vdf.parse(`
				CaseSensitive KeyValue
				casesensitive keyvalue`).pairs('casesensitive'),
			new KeyVRoot()
				.add(new KeyV('CaseSensitive', 'KeyValue'))
				.add(new KeyV('casesensitive', 'keyvalue'))
				.all()
		);

		// assert.deepStrictEqual(
		// 	vdf.parse(`
		// 		CaseSensitive KeyValue
		// 		casesensitive keyvalue`).pairsStrict('casesensitive'),
		// 	new KeyVRoot()
		// 		.add(new KeyV('casesensitive', 'keyvalue'))
		// 		.all()
		// );
	});

	it('Searches for keyvalue sets', () => {
		assert.deepStrictEqual(
			vdf.parse(`
				CaseSensitive {
					A 1
					B 2
				}
				casesensitive {
					a 1
					b 2
				}`).dirs('casesensitive'),
			new KeyVRoot()
				.add(new KeyVSet('CaseSensitive')
					.add(new KeyV('A', '1'))
					.add(new KeyV('B', '2'))
					)
				.add(new KeyVSet('casesensitive')
					.add(new KeyV('a', '1'))
					.add(new KeyV('b', '2'))
					)
				.all()
		);

		// assert.deepStrictEqual(
		// 	vdf.parse(`
		// 		CaseSensitive {
		// 			A 1
		// 			B 2
		// 		}
		// 		casesensitive {
		// 			a 1
		// 			b 2
		// 		}`).dirsStrict('casesensitive'),
		// 	new KeyVRoot()
		// 		.add(new KeyVSet('casesensitive')
		// 			.add(new KeyV('a', '1'))
		// 			.add(new KeyV('b', '2'))
		// 			)
		// 		.all()
		// );
	});
});