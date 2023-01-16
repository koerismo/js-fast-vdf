import { parse as cparse } from './parsecore.js';
import {
	KeyV,  type KeyVChild,  KeyVRoot,  KeyVSet,
	FastV, type FastVChild, FastVSet } from './types.js';

/** Parses fast and creates structures that are efficient to manipulate. Useful for small but complex data! */
export function fancy( data:string ): KeyVRoot {
	let out: KeyVSet|KeyVRoot = new KeyVRoot();

	cparse( data, {
		on_enter(key) {
			out.add(out = new KeyVSet( key ));
		},
		on_exit() {
			if ( !out.parent ) throw( 'Attempted to exit past root keyvalue!' );
			out = out.parent;
		},
		on_key(key, value, query) {
			out.add(new KeyV( key, value, query ));
		},
	});

	return out;
}

/** Parses faster, but creates structures that are less efficient to manipulate. Useful for iterating over large amounts of data! */
export function fast( data:string ): FastVSet {
	let out = new FastVSet();

	cparse( data, {
		on_enter(key) {
			out = out[out.length] = new FastVSet( out, key );
		},
		on_exit() {
			out = out.parent;
			out.length++;
		},
		on_key(key, value, query) {
			out[out.length++] = { key, value, query };
		},
	});

	return out;
}