export type KeyVChild = KeyV|KeyVSet;

/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyVSetCommon {

	#values:	Array<KeyVChild> = [];
	parent:		KeyVSetCommon|null = null;

	/** Retrieves any child of this set with a matching key. This function throws an error when no child is found unless a default value is defined. */
	any( key: string ): KeyVChild
	any<T extends any>( key: string, default_value?: T ): KeyVChild|T;
	any<T extends any>( key: string, default_value?: T ): KeyVChild|T {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key ) return child;
		}

		if (default_value === undefined && i === -1) throw(`Child with key "${key}" does not exist in set!`);
		return default_value;
	}

	/** Retrieves a set within this set. This function throws an error when no set is found unless a default value is defined. */
	dir( key: string ): KeyVSet;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet|T;
	dir<T extends any>( key: string, default_value?: T ): KeyVSet|T {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key && child instanceof KeyVSet ) return child;
		}

		if (default_value === undefined && i === -1) throw(`Subset with key "${key}" does not exist in set!`);
		return default_value;
	}

	dirs( key?: string ): KeyVSet[] {
		const out = [];
		for ( let child of this.#values ) {
			if ( child instanceof KeyVSet && (key == null || key === child.key )) out.push(child);
		}
		return out;
	}

	pairs( key?: string ): KeyV[] {
		const out = [];
		for ( let child of this.#values ) {
			if ( child instanceof KeyV && (key == null || key === child.key )) out.push(child);
		}
		return out;
	}

	/** Retrieves a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	pair( key: string ): KeyV;
	pair<T extends any>( key: string, default_value?: T ): KeyV|T;
	pair<T extends any>( key: string, default_value?: T ): KeyV|T {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key && child instanceof KeyV ) return child;
		}

		if (default_value === undefined && i === -1) throw(`Pair with key "${key}" does not exist in set!`);
		return default_value;
	}

	/** Retrieves the value of a pair within this set. This function throws an error when no pair is found unless a default value is defined. */
	value( key: string ): string;
	value<T extends any>( key: string, default_value?: T ): string|T
	value<T extends any>( key: string, default_value?: T ): string|T {
		return this.pair( key, null )?.value ?? default_value;
	}

	/** Returns an array of all children within this set with matching keys, or all children if no key is provided. */
	all( key?: string ): KeyVChild[] {
		if ( key == undefined ) return this.#values;

		const out = [];
		for ( let child of this.#values ) {
			if ( child.key === key ) out.push( child );
		}
		return out;
	}

	/** Deletes a child object if the key is matched. Returns true if a child was deleted. Warning: This method may affect the order of keys! */
	delete( kv: KeyVChild ): boolean {
		const ind = this.#values.indexOf(kv);
		if (ind === -1) return false;

		// Adapted from https://stackoverflow.com/a/54270177
		this.#values[ind] = this.#values[this.#values.length-1];
		this.#values.pop();

		return true;
	}

	/** Adds a child to this set. */
	add( kv: KeyVChild ): ThisType<KeyVSetCommon> {
		kv.parent = this;
		this.#values.push( kv );
		return this;
	}

	/** Creates a new factory object from this set for creating elements quickly. */
	factory() {
		return new KeyVFactory(this);
	}
}

export class KeyVSet extends KeyVSetCommon {

	key:	string;

	constructor( key: string ) {
		super();
		this.key = key;
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

}


/** A class for KeyVSetCommon quick tree creation. */
class KeyVFactory {
	source: KeyVSetCommon;

	constructor(source: KeyVSetCommon) {
		this.source = source;
	}

	/** Creates to a new directory and moves into it. */
	dir( key: string ): ThisType<KeyVFactory>;
	dir( key: string, strict: true ): ThisType<KeyVFactory>;
	dir( key: string, strict: false|boolean ): ThisType<KeyVFactory>;
	dir( key: string, strict: boolean=false ): ThisType<KeyVFactory> {
		let element = this.source.dir(key, false);
		if (element && strict) throw(`Subset with key "${key}" already exists in set. Operating on existing sets is invalid in strict mode!`);
		if (!element) {
			element = new KeyVSet(key);
			this.source.add(element);
		}

		this.source = element;
		return this;
	}

	/** Creates a new pair. */
	pair( key: string, value: string, query: string|null=null ): ThisType<KeyVFactory> {
		this.source.add(new KeyV(key, value, query));
		return this;
	}

	/** Goes back the specified number of levels. */
	back( levels: number=1 ): ThisType<KeyVFactory> {
		for ( let i=0; i<levels; i++ ) {
			if (this.source.parent === null) throw('Attempted to navigate backwards past root set!');
			this.source = this.source.parent;
		};
		return this;
	}

	/** Exits the factory. */
	exit(): KeyVSetCommon {
		return this.source;
	}
}