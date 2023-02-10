import { parse as cparse } from './parsecore.js';
import { KeyV,  KeyVRoot,  KeyVSet  } from './types.js';

/** Parses data into a tree of objects. */
export function parse( data:string ): KeyVRoot {
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

/** Parses data into a regular javascript object. */
export function json( data:string, env:Object={} ): Object {
	let out = { __parent__: null };

	cparse( data, {
		on_enter(key) {
			out = out[key] = { __parent__: out };
		},
		on_exit() {
			out = out.__parent__;
		},
		on_key(key, value, query) {
			if ((query in env) && !env[query]) return;
			out[key] = value;
		},
	});

	return out;
}