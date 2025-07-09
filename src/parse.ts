import { Char, parse as cparse } from './core.js';
import { KeyV, KeyVChild, KeyVRoot, KeyVSet, ParseError, ValueType, unescape } from './types.js';

export interface SharedParseOptions {
	on_macro?: (key: string, value: ValueType) => KeyVChild[] | undefined;
	escapes?: boolean;
	multilines?: boolean;
	types?: boolean;
}

interface JsonSet {
	[PARENT]?: null|JsonSet;
	[key: string]: JsonSet|ValueType;
}

// Used to track parent nodes in JSON output
const PARENT = Symbol('parent');

/** Parses data into a tree of objects.
 * @param data The text to parse.
 * @param options Tokenization settings to pass to the core parser.
 */
export function parse( data: string ): KeyVRoot<string>;
export function parse<T extends SharedParseOptions>( data: string, options: T ): T['types'] extends true ? KeyVRoot : KeyVRoot<string>;
export function parse( data: string, options?: SharedParseOptions ): KeyVRoot {
	let out: KeyVSet|KeyVRoot = new KeyVRoot();
	const macros = options?.on_macro != undefined;
	const escapes = options?.escapes ?? true;
	const multilines = options?.multilines ?? false;
	const types = options?.types ?? false;

	cparse( data, {
		on_enter(key) {
			out.add(out = new KeyVSet( key ));
		},
		on_exit() {
			if ( !out.parent ) throw new ParseError( 'Attempted to exit past root keyvalue!' );
			out = out.parent;
		},
		on_key(key, value, query) {
			if (escapes) {
				key = unescape(key);
				value = unescape(value);
			}
			if (macros && key.charCodeAt(0) === Char['#']) {
				const append = options.on_macro!(key, value);
				if (append) {
					for ( let i=0; i<append.length; i++ ) out.add(append[i]);
				}
				return;
			}
			out.add(new KeyV( key, value, query ));
		},
		escapes,
		multilines,
		types
	});

	return out;
}

/** Parses data into a regular javascript object.
 * @param data The text to parse.
 * @param env An object containing conditional values to filter keys with. (Ex. `{ '$XBOX': false }` will cause keys with the condition [$XBOX] to be ignored.)
 * @param options Tokenization settings to pass to the core parser.
*/
export function json( data: string, env: Record<string, boolean>={}, options?: SharedParseOptions ): unknown {
	let out: JsonSet = { [PARENT]: null };

	cparse( data, {
		on_enter(key) {
			out = out[key] = { [PARENT]: out };
		},
		on_exit() {
			const ref = out;
			if ( !out[PARENT] ) throw new ParseError( 'Attempted to exit past root keyvalue!' );
			out = out[PARENT];
			delete ref[PARENT];
		},
		on_key(key, value, query) {
			if (query && (query in env) && !env[query]) return;
			out[key] = value;
		},
		escapes: options?.escapes ?? true,
		multilines: options?.multilines ?? true,
		types: options?.types ?? true,
	});

	delete out[PARENT];
	return out;
}