export type KeyVChild = KeyV|KeyVSet;

export interface DumpFormatOptions {
	indent:  string,
	quote:   'always'|'auto'
}

type WriteFunction = (value: string) => void;

const MAX_CONCAT_SIZE = 64000;

const DumpFormatDefaults: DumpFormatOptions = {
	indent:  '\t',
	quote:   'always',
}

// TODO: Implement unescaping strings on import.
// const RE_UNESCAPE = /\\(.)/g;
// function unescape(value: string): string {
// 	return value.replace(RE_UNESCAPE, '$1');
// }

function needs_quotes(value: string): boolean {
	if (value.includes(' ')) return true;
	if (value.startsWith('[') && value.endsWith(']')) return true;
	return false;
}

function escape(value: string, quote: 'auto'|'always') {
	if (quote === 'always' || needs_quotes(value)) {
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
class KeyVSetCommon {

	#values:	Array<KeyVChild> = [];
	parent:		KeyVSetCommon|null = null;

	/** Retrieves any child of this set with a matching key. This function throws an error when no child is found unless a default value is defined. */
	any( key: string ): KeyVChild;
	any<T extends any>( key: string, default_value?: T ): KeyVChild|T;
	any<T extends any>( key: string, default_value?: T ): KeyVChild|T {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Child with key "${key}" does not exist in set!`);
		return default_value;
	}

	/** Returns an array of all children within this set with matching keys, or all children if no key is provided. */
	all( key?: string ): KeyVChild[] {
		if ( key == undefined ) return this.#values;
		key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child.key.toLowerCase() === key) out.push( child );
		}

		return out;
	}

	/** Retrieves a set within this set. This function throws an error when no set is found unless a default value is defined. */
	dir( key: string ): KeyVSet;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet|T;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet|T {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child instanceof KeyVSet && child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Subset with key "${key}" does not exist in set!`);
		return default_value;
	}

	dirs( key?: string ): KeyVSet[] {
		if (key) key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child instanceof KeyVSet && (key == null || child.key.toLowerCase() === key)) out.push(child);
		}

		return out;
	}

	/** Retrieves a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	pair( key: string ): KeyV;
	pair<T extends any>( key: string, default_value?: T ): KeyV|T;
	pair<T extends any>( key: string, default_value?: T ): KeyV|T {
		key = key.toLowerCase();

		for ( let i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child instanceof KeyV && child.key.toLowerCase() === key) return child;
		}

		if (default_value === undefined) throw new Error(`Pair with key "${key}" does not exist in set!`);
		return default_value;
	}

	pairs( key?: string ): KeyV[] {
		if (key) key = key.toLowerCase();

		const out = [];
		for ( const child of this.#values ) {
			if (child instanceof KeyV && (key == null || child.key.toLowerCase() === key)) out.push(child);
		}

		return out;
	}

	/** Retrieves the value of a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	value( key: string ): string;
	value<T extends any>( key: string, default_value?: T ): string|T
	value<T extends any>( key: string, default_value?: T ): string|T {
		return this.pair( key, default_value === undefined ? undefined : null )?.value ?? default_value;
	}

	/** Deletes a child object if the key is matched. Returns true if a child was deleted. If fast is explicitly enabled, the keys will be reordered to make the deletion O(1). */
	delete( kv: KeyVChild, fast: boolean=false ): boolean {
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
	add( kv: KeyVChild ): this {
		kv.parent = this;
		this.#values.push( kv );
		return this;
	}

	/** Creates a new factory object from this set for creating elements quickly. */
	factory() {
		return new KeyVFactory(this);
	}

	dump(format: DumpFormatOptions=DumpFormatDefaults): string {
		const out: string[] = new Array(MAX_CONCAT_SIZE);
		let combined = '';
		let i = 0;

		// Writer function writes to the array until it exceeds the buffer length, at
		// which point it will be appended to the string in one expensive operation.
		this.__dump__(format, '', (value: string) => {
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

	__dump__(format: DumpFormatOptions, indent: string, write: WriteFunction) {
		for ( const child of this.#values ) {
			child.__dump__(format, indent, write);
		}
	}
}

export class KeyVSet extends KeyVSetCommon {

	key:	string;

	constructor( key: string ) {
		super();
		this.key = key;
	}

	__dump__(format: DumpFormatOptions, indent: string, write: WriteFunction) {
		write(
			indent
			+ escape(this.key, format.quote)
			+ '\n' + indent + '{\n'
		);

		super.__dump__(format, indent + format.indent, write);
		write( indent + '}\n' );
	}
}


export class KeyVRoot extends KeyVSetCommon {}


export class KeyV {

	key:	string;
	value:	string;
	query:	string|null;
	parent:	KeyVSetCommon|null;

	constructor( key: string, value: string, query: string|null=null ) {
		this.key	= key;
		this.value	= value;
		this.query	= query;
		this.parent	= null;
	}

	__dump__(format: DumpFormatOptions, indent: string, write: WriteFunction) {
		write(
			indent
			+ escape(this.key, format.quote)
			+ ' '
			+ escape(this.value, format.quote)
			+ ( this.query === null ? '\n' : ' [' + this.query + ']\n' )
		);
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
	pair( key: string, value: string, query: string|null=null ): this {
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