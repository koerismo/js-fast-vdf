import { Char, parse as cparse } from './core.js';
import { KeyV, KeyVRoot, KeyVSet, ParseError, ValueType, unescape } from './types.js';

export interface SharedParseOptions<T = KeyVSet|KeyVRoot> {
	/** Optional handler for `#macro` syntax keyvalues. If no handler is provided, macros will be treated as standard keys. */
	on_macro?: (key: string, value: ValueType, context: T) => void;
	/** Optional handler for `[query]` syntax. If present, keyvalues with `false` queries will be omitted. */
	on_query?: (query: string) => boolean;
	/** Should escape sequences be parsed? Defaults to `true` */
	escapes?: boolean;
	/** Should multiline comments be accepted as valid syntax? Defaults to `false` */
	multilines?: boolean;
	/** Should values be interpreted as primitive values? Defaults to `false` */
	types?: boolean;
}

export interface JsonSet<T = ValueType> {
	[key: string]: JsonSet|T;
}

interface JsonSetInternal {
	[PARENT]?: null|JsonSet;
	[key: string]: JsonSetInternal|ValueType;
}

// Used to track parent nodes in JSON output
const PARENT = Symbol('parent');

/** Parses data into a tree of objects.
 * @param text The text to parse.
 * @param options Tokenization settings to pass to the core parser.
 */
export function parse( text: string ): KeyVRoot<string>;
export function parse<T extends SharedParseOptions>( text: string, options: T ): T['types'] extends true ? KeyVRoot : KeyVRoot<string>;
export function parse( text: string, options?: SharedParseOptions ): KeyVRoot {
	let out: KeyVSet|KeyVRoot = new KeyVRoot();
	const macros = options?.on_macro != undefined;
	const queries = options?.on_query != undefined;
	const escapes = options?.escapes ?? true;
	const multilines = options?.multilines ?? false;
	const types = options?.types ?? false;

	cparse( text, {
		on_enter(key) {
			out.add(out = new KeyVSet( key ));
		},
		on_exit() {
			if ( !out.parent ) throw new ParseError( 'Attempted to exit past root keyvalue!' );
			out = out.parent;
		},
		on_key(key, value, query) {
			if (query && queries && !options!.on_query!(query))
				return;
			if (escapes) {
				key = unescape(key);
				value = unescape(value);
			}
			if (macros && key.charCodeAt(0) === Char['#']) {
				options.on_macro!(key, value, out);
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
 * @param text The text to parse.
 * @param options Tokenization settings to pass to the core parser.
*/
export function json( text: string ): JsonSet<string>;
export function json<T extends SharedParseOptions>( text: string, options: T ): T['types'] extends true ? JsonSet : JsonSet<string>;
export function json( text: string, options?: SharedParseOptions<JsonSet> ): JsonSet {
	let out: JsonSetInternal = { [PARENT]: null };
	const escapes = options?.escapes ?? true;
	const macros = options?.on_macro != undefined;
	const queries = options?.on_query != undefined;

	cparse( text, {
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
			if (query && queries && !options!.on_query!(query))
				return;
			if (escapes) {
				key = unescape(key);
				value = unescape(value);
			}
			if (macros && key.charCodeAt(0) === Char['#']) {
				options.on_macro!(key, value, out);
				return;
			}
			out[key] = value;
		},
		escapes,
		multilines: options?.multilines ?? true,
		types: options?.types ?? true,
	});

	delete out[PARENT];
	return out;
}