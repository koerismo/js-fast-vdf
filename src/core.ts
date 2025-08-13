import { ParseError, type ValueType } from './types.js';

export interface CoreParseOptions {
	on_key:		(key:string, value:ValueType, query?:string) => void;
	on_enter:	(key:string) => void;
	on_exit:	() => void;
	escapes:	boolean;
	multilines:	boolean;
	types:      boolean;
}

export const enum Char {
	'\t' = 9,
	'\n' = 10,
	'\r' = 13,
	' ' = 32,
	'"' = 34,
	'#' = 35,
	'*' = 42,
	'/' = 47,
	'[' = 91,
	'\\' = 92,
	']' = 93,
	'{' = 123,
	'}' = 125,
}

function parse_value( value: string ): string|number|boolean {
	if (value === 'true') return true;
	if (value === 'false') return false;
	const num = +value;
	if (isNaN(num)) return value;
	return num;
}

function is_term( code: number ) {
	return (
		code === Char[' '] || code === Char['\t'] || code === Char['\r'] || code === Char['\n'] ||
		code === Char['{'] || code === Char['}'] );
}

/** Parses the given string and calls the provided callbacks as they are processed. */
export function parse( text: string, options: CoreParseOptions ): void {
	const escapes		= options.escapes;
	const length		= text.length;

	let key: string|null = null;
	let value: ValueType|null = null;

	for ( let i=0; i<length; i++ ) {
		const c = text.charCodeAt(i);

		// Spacing ( tab, space, \n, \r )
		if ( c === Char[' '] || c === Char['\t'] || c === Char['\n'] || c === Char['\r'] ) continue;

		// Start bracket
		if ( c === Char['{'] ) {
			if ( key === null ) throw new ParseError( `Attempted to enter block without key at ${i}!` );
			options.on_enter( key );
			key = null;
			continue;
		}

		// End bracket
		if ( c === Char['}'] ) {
			if ( key !== null ) {
				if ( value === null ) throw new ParseError( `Encountered unpaired key "${key}" before ending bracket at ${i}!` );
				else options.on_key( key, value );
			}
			key = value = null;
			options.on_exit();
			continue;
		}

		// Quoted string
		if ( c === Char['"'] ) {
			const start = i+1;
			
			if (escapes) {
				let n: number;
				while (i < length) {
					// Find next quote
					i = text.indexOf('"', i+1);
					if (i === -1) throw new ParseError( `Encountered unterminated quote starting at ${start-1}!` );
					if (text.charCodeAt(i - 1) !== Char['\\']) break;
					n = 2;
					while (text.charCodeAt(i - n) === Char['\\']) n++;
					if (n & 1) break;
				}
			}
			else {
				i = text.indexOf('"', i+1);
				if (i === -1) throw new ParseError( `Encountered unterminated quote starting at ${start-1}!` );
			}

			const chunk = text.slice(start, i);
			if ( key === null )			key = chunk;
			else if ( value === null )	value = chunk;
			else {
				options.on_key( key, value );
				value = null, key = chunk;
			}

			continue;
		}

		// Single-line comment ( // )
		if ( c  === Char['/'] ) {
			const c2 = text.charCodeAt(i+1);

			if ( c2  === Char['/'] ) {
				i = text.indexOf('\n', i+1);
				if ( i === -1 ) break;
				continue;
			}

			if ( options.multilines && c2 === Char['*'] ) {
				const start = i;
				while (true) {
					i = text.indexOf('*', i+1);
					if ( i === -1 ) throw new ParseError( `Encountered unterminated multiline comment starting at ${start}!` );
					if ( text.charCodeAt(i+1) === Char['/'] ) break;
				}

				i ++;
				continue;
			}
		}

		// Non-quoted string
		// If we reach here, that means that this is neither a control nor a space character.
		{
			const start = i;

			while (i < length) {
				i++;
				const c = text.charCodeAt(i);
				if ( escapes && c === Char['\\'] ) { i++; continue; }
				if ( is_term(c) ) break;
			}

			const chunk = text.slice(start, i);
			if ( key === null )			key = chunk;
			else if ( value === null )	value = options.types ? parse_value(chunk) : chunk;
			else {
				if ( text.charCodeAt(start) === Char['['] && text.charCodeAt(i-1) === Char[']'] ) {
					options.on_key( key, value, text.slice(start+1, i-1) );
					key = null;
				}
				else {
					options.on_key( key, value );
					key = chunk;
				}
				value = null;
			}
		}
	}

	if ( key !== null && value === null ) throw new ParseError( `Encountered unpaired key "${key}" at EOF!` );
	else if ( value !== null ) options.on_key( key as string, value );
	return;
}
