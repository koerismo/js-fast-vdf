export type KeyValueChild = KeyValue|KeyValueSet;

/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyValueSetCommon {

	// [key: string]: KeyValueChild;
	#values:	Array<KeyValueChild>;
	#map:		{[key:string]: KeyValueChild};
	parent:		KeyValueSetCommon|null = null;

	constructor( values?: KeyValueChild[] ) {
		this.#values = values||[];
	}

	/** Returns a single key. */
	get( key: string ): KeyValueChild|undefined {
		return this.#map[key];
	}

	/** Returns an array of children with matching keys, or all children if no key is provided. */
	all( key?: string ): KeyValueChild[] {
		if ( key == undefined ) return this.#values;

		const out = [];
		for ( let child of this.#values ) {
			if ( child.key === key ) out.push( child );
		}
		return out;
	}

	/** Deletes a child object if the key is matched. Returns true if a child was deleted. Warning: This method may affect the order of keys! */
	delete( kv: KeyValueChild ): boolean {
		if (!(kv.key in this)) return false;

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
	add( kv: KeyValueChild ): KeyValueChild {
		kv.parent = this;
		this.#map[kv.key] = kv;
		this.#values.push( kv );
		return kv;
	}
}


/** Defines a node with children in a KeyValues structure. */
export class KeyValueSet extends KeyValueSetCommon {

	key:	string;

	constructor( key: string, values?: KeyValueChild[] ) {
		super( values );
		this.key = key;
	}
}


/** Defines the root of a KeyValues structure. */
export class KeyValueRoot extends KeyValueSetCommon {}


/** Defines a key-value pair. */
export class KeyValue {

	key:	string;
	value:	string;
	query:	string|null;
	parent:	KeyValueSetCommon|null;

	constructor( key: string, value: string, query: string|null=null ) {
		this.key	= key;
		this.value	= value;
		this.query	= query;
		this.parent	= null;
	}

}


export type FastSet = {
	key: string,
	length: number,
	_: FastSet|FastRoot,
	[index: number]: FastKey|FastSet,
}


export type FastRoot = {
	length: number,
	_: null,
	[index: number]: FastKey|FastSet,
}


export type FastKey = {
	key: string,
	value: string,
	query?: string,
}