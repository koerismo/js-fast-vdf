import { ParseError, ValueType } from './types.js';

export interface CoreParseOptions {
	on_key:		(key:string, value:ValueType, query?:string) => void;
	on_enter:	(key:string) => void;
	on_exit:	() => void;
	escapes:	boolean;
	multilines:	boolean;
	types:      boolean;
}

export const enum Char {
	'"' = 34,
	'#' = 35,
	'*' = 42,
	'/' = 47,
	'{' = 123,
	'}' = 125,
	'[' = 91,
	'\\' = 92,
	']' = 93,
	'\r' = 13,
	'\n' = 10,
	' ' = 32,
	'\t' = 9,
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
		code == Char[' '] || code == Char['\t'] || code == Char['\r'] || code == Char['\n'] ||
		code == Char['{'] || code == Char['}'] );
}

/** Parses the given string and calls the provided callbacks as they are processed. */
export function parse( text: string, options: CoreParseOptions ): void {
	const no_escapes	= !options.escapes;
	const length		= text.length;

	let key: string|null = null;
	let value: ValueType|null = null;

	for ( let i=0; i<length; i++ ) {
		const c = text.charCodeAt(i);
		const escaped = !no_escapes && text.charCodeAt(i-1) === Char['\\'];

		// Spacing ( tab, space, \r, \n )
		if ( c === Char[' '] || c === Char['\t'] || c === Char['\r'] || c === Char['\n'] ) continue;

		// Start bracket
		if ( c === Char['{'] && !escaped ) {
			if ( key === null ) throw new ParseError( `Attempted to enter block without key at ${i}!` );
			options.on_enter( key );
			key = null;
			continue;
		}

		// End bracket
		if ( c === Char['}'] && !escaped ) {
			if ( key !== null && value === null ) throw new ParseError( `Encountered unpaired key "${key}" before ending bracket at ${i}!` );
			else if ( value !== null ) options.on_key( key as string, value );
			key = value = null;
			options.on_exit();
			continue;
		}

		// Quoted string
		if ( c === Char['"'] && !escaped ) {
			const start = i+1;

			while (true) {
				i = text.indexOf('"', i+1);
				if (i === -1) throw new ParseError( `Encountered unterminated quote starting at ${start-1}!` );
				if (no_escapes || text.charCodeAt(i-1) !== Char['\\']) break;
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
		if ( c  === Char['/'] && text.charCodeAt(i+1) === Char['/'] ) {
			i = text.indexOf('\n', i+1);
			if ( i === -1 ) break;
			continue;
		}

		// Multi-line comment ( /* )
		if ( options.multilines && c === 47 && text.charCodeAt(i+1) === Char['*'] ) {
			const start = i;
			while (true) {
				i = text.indexOf('*', i+1);
				if ( i === -1 ) throw new ParseError( `Encountered unterminated multiline comment starting at ${start}!` );
				if ( text.charCodeAt(i+1) === Char['/'] ) break;
			}

			i ++;
			continue;
		}

		// Non-quoted string
		// If we reach here, that means that this is neither a terminator nor a space character.
		{
			const start = i;

			while (i < length) {
				i++;
				if ( is_term(text.charCodeAt(i)) && (no_escapes || text.charCodeAt(i-1) !== Char['\\']) ) break;
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
