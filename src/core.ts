import { ParseError, ValueType } from './types.js';

export interface ParseOptions {
	on_key:		(key:string, value:ValueType, query?:string) => void;
	on_enter:	(key:string) => void;
	on_exit:	() => void;
	escapes:	boolean;
	multilines:	boolean;
	types:      boolean;
}

const C_QUOTE  = 34,  S_QUOTE  = '"',
      C_STAR   = 42,  S_STAR   = '*',
      C_SLASH  = 47,  S_SLASH  = '/',
      C_BOPEN  = 123, S_BOPEN  = '{',
      C_BCLOSE = 125, S_BCLOSE = '}',
      C_ESCAPE = 92,  S_ESCAPE = '\\',
      C_LN     = 10,  S_LN     = '\n';

function is_plain( code: number ) {
	return (
		( code > 32 && code < 92 ) ||
		( code > 92 && code < 125 )
	);
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
		code == 32 || code == 9 || code == 13 || code == C_LN ||
		code == C_BOPEN || code == C_BCLOSE );
}

export function parse( text: string, options: ParseOptions ): void {
	const no_escapes	= !options.escapes;
	const length		= text.length;

	let key: string|null = null;
	let value: ValueType|null = null;

	for ( let i=0; i<length; i++ ) {
		const c = text.charCodeAt(i);
		const escaped = !no_escapes && text.charCodeAt(i-1) === C_ESCAPE;

		// Spacing ( tab, space, \r, \n )
		if ( c === 32 || c === 9 || c === 13 || c === C_LN ) continue;

		// Start bracket
		if ( c === C_BOPEN && !escaped ) {
			if ( key === null ) throw new ParseError( `Attempted to enter block without key at ${i}!` );
			options.on_enter( key );
			key = null;
			continue;
		}

		// End bracket
		if ( c === C_BCLOSE && !escaped ) {
			if ( key !== null && value === null ) throw new ParseError( `Encountered unpaired key before ending bracket at ${i}!` );
			else if ( value !== null ) options.on_key( key as string, value );
			key = value = null;
			options.on_exit();
			continue;
		}

		// Quoted string
		if ( c === C_QUOTE && !escaped ) {
			const start = i+1;

			while (true) {
				i = text.indexOf(S_QUOTE, i+1);
				if (i === -1) throw new ParseError( `Encountered unterminated quote starting at ${start-1}!` );
				if (no_escapes || text.charCodeAt(i-1) !== C_ESCAPE) break;
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
		if ( c  === 47 && text.charCodeAt(i+1) === 47 ) {
			i = text.indexOf(S_LN, i+1);
			if ( i === -1 ) break;
			continue;
		}

		// Multi-line comment ( /* )
		if ( options.multilines && c === 47 && text.charCodeAt(i+1) === 42 ) {
			const start = i;
			while (true) {
				i = text.indexOf(S_STAR, i+1);
				if ( i === -1 ) throw new ParseError( `Encountered unterminated multiline comment starting at ${start}!` );
				if ( text.charCodeAt(i+1) === C_SLASH ) break;
			}

			i ++;
			continue;
		}

		// Non-quoted string
		if ( is_plain(c) ) {
			const start = i;

			while (i < length) {
				i++;
				if ( is_term(text.charCodeAt(i)) && (no_escapes || text.charCodeAt(i-1) !== C_ESCAPE) ) break;
			}

			const chunk = text.slice(start, i);
			if ( key === null )			key = chunk;
			else if ( value === null )	value = options.types ? parse_value(chunk) : chunk;
			else {
				if ( text.charCodeAt(start) === 91 && text.charCodeAt(i-1) === 93 ) {
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

	if ( key !== null && value === null ) throw new ParseError( 'Encountered unpaired key!' );
	else if ( value !== null ) options.on_key( key as string, value );
	return;
}