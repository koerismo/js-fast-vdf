export type KeyVChild = KeyV|KeyVSet;
export type FastVChild = FastV|FastVSet;

/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyVSetCommon {

	// [key: string]: KeyVChild;
	#values:	Array<KeyVChild> = [];
	#map:		{[key:string]: KeyVChild} = {};
	parent:		KeyVSetCommon|null = null;

	/** Returns whether this set contains one or more pairs with the specified key. */
	has( key: string ): boolean {
		return key in this.#map;
	}

	/** Returns the last instance of a pair by key. */
	get<S>( key: string, strict: S|boolean=true ): S extends false ? KeyVChild|undefined : KeyVChild {
		if (strict && !(key in this.#map)) throw( `KeyValueSet.get: Key "${key}" does not exist in set!` );
		return this.#map[key];
	}

	/** Shorthand for KeyVSetCommon.get(...) */
	_ = this.get;

	/** Returns an array of children with matching keys, or all children if no key is provided. */
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
		if (!(kv.key in this.#map)) return false;

		// Adapted from https://stackoverflow.com/a/54270177
		this.#values[this.#values.indexOf(kv)] = this.#values[this.#values.length-1];
		this.#values.pop();

		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			if ( this.#values[i].key === kv.key ) {
				this.#map[kv.key] = this.#values[i];
				break;
			};
		}

		if ( i === -1 ) delete this.#map[kv.key];
		return true;
	}

	/** Adds a child to this set. */
	add( kv: KeyVChild ): KeyVChild {
		kv.parent = this;
		this.#map[kv.key] = kv;
		this.#values.push( kv );
		return kv;
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


export class FastVSet {
	key?:			string;
	parent?:		FastVSet;

	length:			number = 0;
	__map__:		{[key: string]: number} = {};
	[key: number]: 	FastVChild;

	constructor( parent?: FastVSet, key?: string ) {
		if ( parent ) {
			this.parent = parent,
			this.key = key;
		}
	}

	/** Gets a key, and indexes it if it has not been already. */
	get( key: string, strict=true ) {
		if (!( key in this.__map__ )) {
			this.__map__[key] = undefined;
			for ( let i=this.length-1; i>-1; i-- ) {
				if ( this[i].key === key ) { this.__map__[key] = i; return this[i] }
			}
		}

		if (this.__map__[key] === undefined) {
			if (strict)		throw( `Key ${key} does not exist in set!` );
			else			return undefined;
		}

		return this[this.__map__[key]];
	}

	/** Shorthand for VKeySet.get(...) */
	_ = this.get;

	/** Returns all instances of a key. If you just need the count, use .count() instead! */
	all( key?: string ): (FastV|FastVSet)[] {
		if ( key == undefined ) {
			const out = new Array(this.length);
			for ( let i=0; i<this.length; i++ ) out[i] = this[i];
			return out;
		}

		const out = [];
		for ( let i=0; i<this.length; i++ ) {
			if ( this[i].key === key ) out.push(this[i]);
		}

		return out;
	}

	/** Adds a new key and indexes it. */
	add( kv: FastV ) {
		this[this.length] = kv;
		this.__map__[kv.key] = this.length++;
	}

	/** !NOT IMPLEMENTED! Deletes a single key, and returns whether the operation was completed. */
	delete( kv: FastV ): never {
		throw( `NotImplemented: FastVSet.delete(...) is not implemented at this time!` );
	}

	/** Indexes the provided key and returns the number of matching keys found */
	count( key: string, bool=false ): number {
		let count = 0;

		for ( let i=this.length-1; i>-1; i-- ) {
			if ( !count && this[i].key === key ) this.__map__[key] = i;
			if ( this[i].key === key ) count++;
			if ( count && bool ) return 1;
		}

		if ( !count ) this.__map__[key] = undefined;
		return count;
	}
}


export interface FastV {
	key: string;
	value: string;
	query?: string;
}