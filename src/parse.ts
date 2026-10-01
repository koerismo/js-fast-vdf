/**
 * Contains methods for parsing data into JavaScript structures using the core tokenizer/parser.
 * @module
 */

import { Char, parse as cparse } from './core.js';
import { KeyV, KeyVRoot, KeyVSet, ParseError, ValueType, unescape } from './types.js';

/** Common parse options for the {@link parse}(...) and {@link json}(...) methods. Extends the core tokenizer/parser configuration. */
export interface SharedParseOptions<T = KeyVSet | KeyVRoot> {
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

/** A parsed JSON object. */
export interface JsonSet<T = ValueType> {
	[key: string]: JsonSet<T> | T;
}

/** Sets `target[key]`, except that `__proto__` becomes an own key (as with JSON.parse) rather than replacing the prototype of `target`. */
function assign(target: JsonSet, key: string, value: JsonSet | ValueType) {
	if (key === '__proto__') {
		Object.defineProperty(target, key, {
			value,
			writable: true,
			enumerable: true,
			configurable: true,
		});
	} else {
		target[key] = value;
	}
}

/** Parses data into a tree of objects.
 * @param text The text to parse.
 * @param options Tokenization settings to pass to the core parser.
 */
export function parse(text: string): KeyVRoot<string>;
export function parse<T extends SharedParseOptions>(
	text: string,
	options: T,
): T['types'] extends true ? KeyVRoot : KeyVRoot<string>;
export function parse(text: string, options?: SharedParseOptions): KeyVRoot {
	let out: KeyVSet | KeyVRoot = new KeyVRoot();
	const macros = options?.on_macro != undefined;
	const queries = options?.on_query != undefined;
	const escapes = options?.escapes ?? true;
	const multilines = options?.multilines ?? false;
	const types = options?.types ?? false;

	cparse(text, {
		on_enter(key) {
			out.add((out = new KeyVSet(key)));
		},
		on_exit() {
			if (!out.parent) throw new ParseError('Attempted to exit past root keyvalue!');
			out = out.parent;
		},
		on_key(key, value, query) {
			if (query && queries && !options!.on_query!(query)) return;
			if (escapes) {
				key = unescape(key);
				value = unescape(value);
			}
			if (macros && key.charCodeAt(0) === Char['#']) {
				options.on_macro!(key, value, out);
				return;
			}
			out.add(new KeyV(key, value, query));
		},
		escapes,
		multilines,
		types,
	});

	return out;
}

/** Parses data into a regular javascript object.
 * @param text The text to parse.
 * @param options Tokenization settings to pass to the core parser.
 */
export function json(text: string): JsonSet<string>;
export function json<T extends SharedParseOptions>(
	text: string,
	options: T,
): T['types'] extends true ? JsonSet : JsonSet<string>;
export function json(text: string, options?: SharedParseOptions<JsonSet>): JsonSet {
	let out: JsonSet = {};
	// Parents are tracked outside the objects, since deleting a tracking key leaves every returned object in slow dictionary mode
	const parents: JsonSet[] = [];
	const escapes = options?.escapes ?? true;
	const macros = options?.on_macro != undefined;
	const queries = options?.on_query != undefined;

	cparse(text, {
		on_enter(key) {
			const child: JsonSet = {};
			assign(out, key, child);
			parents.push(out);
			out = child;
		},
		on_exit() {
			const parent = parents.pop();
			if (!parent) throw new ParseError('Attempted to exit past root keyvalue!');
			out = parent;
		},
		on_key(key, value, query) {
			if (query && queries && !options!.on_query!(query)) return;
			if (escapes) {
				key = unescape(key);
				value = unescape(value);
			}
			if (macros && key.charCodeAt(0) === Char['#']) {
				options.on_macro!(key, value, out);
				return;
			}
			assign(out, key, value);
		},
		escapes,
		multilines: options?.multilines ?? true,
		types: options?.types ?? true,
	});

	return out;
}
