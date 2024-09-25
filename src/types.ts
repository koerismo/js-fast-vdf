export type KeyVChild<V extends ValueType = ValueType> = KeyV<V>|KeyVSet<V>;

export type ValueType = string|number|boolean;

export class ParseError extends Error {
	name = 'ParseError';
}

export interface DumpFormatOptions {
	indent:   string;
	quote:    'always'|'auto'|'auto-typed';
	escapes:  boolean;
}

type WriteFunction = (value: string) => void;

const MAX_CONCAT_SIZE = 64000;

const DumpFormatDefaults: DumpFormatOptions = {
	indent:   '\t',
	quote:    'always',
	escapes:  false
}

// TODO: Implement unescaping strings on import.
// const RE_UNESCAPE = /\\(.)/g;
// function unescape(value: string): string {
// 	return value.replace(RE_UNESCAPE, '$1');
// }

function needs_quotes(value: string, is_value: boolean, type_strict: boolean): boolean {
	if (!value.length) return true;
	if (value.includes(' ')) return true;
	if (!is_value && value.startsWith('[') && value.endsWith(']')) return true;

	// Detect values which could be interpreted as non-strings.
	if (type_strict && is_value && (!isNaN(+value) || value === 'true' || value === 'false')) return true;

	return false;
}

function escape(value: ValueType, options: DumpFormatOptions, is_value: boolean): string {
	if (typeof value !== 'string') return value.toString();
	const quote = options.quote === 'always' || needs_quotes(value, is_value, options.quote === 'auto-typed');

	if (!options.escapes) {
		if (quote) return '"' + value + '"';
		return value;
	}

	if (quote) {
		const escaped = value
			.replaceAll('\\', '\\\\')
			.replaceAll('"', '\\"');
		return '"' + escaped + '"';
	}

	return value
		.replaceAll('\\', '\\\\')
		.replaceAll('"', '\\"')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}');
}


/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyVSetCommon<V extends ValueType = ValueType> {

	#values:	Array<KeyVChild<V>> = [];
	parent:		KeyVSetCommon|null = null;

	/** Retrieves any child of this set with a matching key. This function throws an error when no child is found unless a default value is defined. */
	any( key: string ): KeyVChild<V>;
	any<T extends any>( key: string, default_value?: T ): KeyVChild<V>|T;
	any<T extends any>( key: string, default_value?: T ): KeyVChild<V>|T {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Child with key "${key}" does not exist in set!`);
		return default_value;
	}

	/** Returns an array of all children within this set with matching keys, or all children if no key is provided. */
	all( key?: string ): KeyVChild<V>[] {
		if ( key == undefined ) return this.#values;
		key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child.key.toLowerCase() === key) out.push( child );
		}

		return out;
	}

	/** Retrieves a set within this set. This function throws an error when no set is found unless a default value is defined. */
	dir( key: string ): KeyVSet<V>;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet<V>|T;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet<V>|T {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child instanceof KeyVSet && child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Subset with key "${key}" does not exist in set!`);
		return default_value;
	}

	dirs( key?: string ): KeyVSet<V>[] {
		if (key) key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child instanceof KeyVSet && (key == null || child.key.toLowerCase() === key)) out.push(child);
		}

		return out;
	}

	/** Retrieves a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	pair<D extends undefined>( key: string, default_value?: D ): KeyV<V>|never;
	pair<D extends unknown>( key: string, default_value?: D ): KeyV<V>|D;
	pair<D extends unknown>( key: string, default_value?: D ): KeyV<V>|D|never {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child instanceof KeyV && child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Pair with key "${key}" does not exist in set!`);
		return default_value;
	}

	pairs( key?: string ): KeyV<V>[] {
		if (key) key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child instanceof KeyV && (key == null || child.key.toLowerCase() === key)) out.push(child);
		}

		return out;
	}

	/** Retrieves the value of a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	value<D extends undefined>( key: string, default_value?: D ): V|never;
	value<D extends unknown>( key: string, default_value?: D ): V|D;
	value<D extends unknown>( key: string, default_value?: D ): V|D|never {
		const pair = this.pair(key, default_value === undefined ? undefined : null);
		if (pair === null) return default_value as D;
		return pair.value;
	}

	/** Deletes a child object if the key is matched. Returns true if a child was deleted. If fast is explicitly enabled, the keys will be reordered to make the deletion O(1). */
	delete( kv: KeyVChild<V>, fast: boolean=false ): boolean {
		const ind = this.#values.indexOf(kv);
		if (ind === -1) return false;

		if (!fast) {
			this.#values.splice(ind, 1);
			return true;
		}

		// Adapted from https://stackoverflow.com/a/54270177
		this.#values[ind] = this.#values[this.#values.length-1];
		this.#values.pop();

		return true;
	}

	/** Adds a child to this set. */
	add( kv: KeyVChild<V> ): this {
		kv.parent = this;
		this.#values.push( kv );
		return this;
	}

	/** Creates a new factory object from this set for creating elements quickly. */
	factory(): KeyVFactory {
		return new KeyVFactory(this);
	}

	dump( options: Partial<DumpFormatOptions>=DumpFormatDefaults ): string {
		options = Object.assign({}, DumpFormatDefaults, options);
		const out: string[] = new Array(MAX_CONCAT_SIZE);
		let combined = '';
		let i = 0;

		// Writer function writes to the array until it exceeds the buffer length, at
		// which point it will be appended to the string in one expensive operation.
		this.__dump__(options as DumpFormatOptions, '', (value: string) => {
			out[i] = value;
			i = (i+1) % MAX_CONCAT_SIZE;
			if (i === 0) {
				combined = String.prototype.concat.apply(combined, out);
			}
		});

		// Leftover content, if it exists, is also appended to the string. This
		// has to be handled somewhat carefully to avoid spillage from previous
		// rounds of data handling.
		if (i) combined = String.prototype.concat.apply(combined, out.slice(0, i));
		return combined;
	}

	__dump__( format: DumpFormatOptions, indent: string, write: WriteFunction ): void {
		for ( const child of this.#values ) {
			child.__dump__(format, indent, write);
		}
	}
}

export class KeyVSet<V extends ValueType = ValueType> extends KeyVSetCommon<V> {

	key:	string;

	constructor( key: string ) {
		super();
		this.key = key;
	}

	__dump__(format: DumpFormatOptions, indent: string, write: WriteFunction): void {
		write(
			indent
			+ escape(this.key, format, false)
			+ '\n' + indent + '{\n'
		);

		super.__dump__(format, indent + format.indent, write);
		write( indent + '}\n' );
	}
}


export class KeyVRoot<V extends ValueType = ValueType> extends KeyVSetCommon<V> {}


export class KeyV<V extends ValueType = ValueType> {

	key:	string;
	value:	V;
	query:	string|null;
	parent:	KeyVSetCommon|null;

	constructor( key: string, value: V, query: string|null=null ) {
		this.key	= key;
		this.value	= value;
		this.query	= query;
		this.parent	= null;
	}

	__dump__(format: DumpFormatOptions, indent: string, write: WriteFunction): void {
		write(
			indent
			+ escape(this.key, format, false)
			+ ' '
			+ escape(this.value, format, true)
			+ ( this.query === null ? '\n' : ' [' + this.query + ']\n' )
		);
	}

	float(): number|never;
	float<T>(default_value: T): number|T;
	float<T>(default_value?: T): number|T|never {
		const v = parseFloat(this.value as string);
		if (isNaN(v)) {
			if (default_value !== undefined) return default_value;
			throw new TypeError(`Could not coerce value "${this.value}" to float!`);
		}
		return v;
	}

	int(): number|never;
	int<T>(default_value: T): number|T;
	int<T>(default_value?: T): number|T|never {
		const v = parseInt(this.value as string);
		if (isNaN(v)) {
			if (default_value !== undefined) return default_value;
			throw new TypeError(`Could not coerce value "${this.value}" to int!`);
		}
		return v;
	}

	string(): string {
		return this.value.toString();
	}

	bool(): boolean {
		return !(!this.value || this.value === 'off' || this.value === 'false' || this.value === '0');
	}

	vector(): ArrayLike<number>|never;
	vector<T>(default_value: T, bracket_L?: string, bracket_R?: string): ArrayLike<number>|T;
	vector<T>(default_value?: T, bracket_L: string='[', bracket_R: string=']'): ArrayLike<number>|T|never {
		// This label allows us to use 'break attempt' as a pseudo-return for fail cases
		attempt: if (typeof this.value === 'string') {
			if (!this.value.startsWith(bracket_L) || !this.value.endsWith(bracket_R)) break attempt;

			const split = this.value.slice(bracket_L.length, (-bracket_R.length || undefined)).trim().split(' ');
			const vec = new Float64Array(split.length);

			for (let i=0; i<vec.length; i++) {
				const element = vec[i] = parseFloat(split[i]);
				if (isNaN(element)) break attempt;
			}

			return vec;
		}

		if (default_value !== undefined) return default_value;
		throw new TypeError(`Could not parse value "${this.value}" as vector!`);
	}
}


/** A class for KeyVSetCommon quick tree creation. */
class KeyVFactory {
	source: KeyVSetCommon;

	constructor(source: KeyVSetCommon) {
		this.source = source;
	}

	/** Creates to a new directory and moves into it. */
	dir( key: string ): this {
		const dir = new KeyVSet(key);
		this.source.add(dir);
		this.source = dir;
		return this;
	}

	/** Creates a new pair. */
	pair( key: string, value: ValueType, query: string|null=null ): this {
		this.source.add(new KeyV(key, value, query));
		return this;
	}

	/** Goes back the specified number of levels. */
	back( levels: number=1 ): this {
		for ( let i=0; i<levels; i++ ) {
			if (this.source.parent === null) throw new Error('Attempted to navigate backwards past root set!');
			this.source = this.source.parent;
		};
		return this;
	}

	/** Exits the factory. */
	exit(): KeyVSetCommon {
		return this.source;
	}
}