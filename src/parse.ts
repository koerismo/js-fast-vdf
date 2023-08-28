import { parse as cparse } from './core.js';
import { KeyV,  KeyVRoot,  KeyVSet  } from './types.js';

interface SharedParseOptions {
	escapes?: boolean;
	multilines?: boolean;
}

/** Parses data into a tree of objects.
 * @param {string} data The data to parse.
 */
export function parse( data:string, options?: SharedParseOptions ): KeyVRoot {
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
		escapes: options?.escapes ?? true,
		multilines: options?.multilines ?? true,
	});

	return out;
}

/** Parses data into a regular javascript object. */
export function json( data:string, env:Object={}, options?: SharedParseOptions ): unknown {
	let out = { __parent__: null };

	cparse( data, {
		on_enter(key) {
			out = out[key] = { __parent__: out };
		},
		on_exit() {
			const ref = out;
			out = out.__parent__;
			delete ref.__parent__;
		},
		on_key(key, value, query) {
			if ((query in env) && !env[query]) return;
			out[key] = value;
		},
		escapes: options?.escapes ?? true,
		multilines: options?.multilines ?? true,
	});

	delete out.__parent__;
	return out;
}