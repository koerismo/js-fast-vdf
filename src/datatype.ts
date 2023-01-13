export type KeyValueChild = KeyValue|KeyValueSet;

/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyValueSetCommon {

	// [key: string]: KeyValueChild;
	values:		Array<KeyValueChild>;
	parent:		KeyValueSetCommon|null = null;

	constructor( values?: KeyValueChild[] ) {
		this.values = values||[];
	}

	/** Returns an array of children with matching keys. */
	get( key: string ): KeyValueChild[] {
		const out = [];
		for ( let child of this.values ) {
			if ( child.key === key ) out.push( child );
		}
		return out;
	}

	/** Deletes a child object if the key is matched. Returns true if a child was deleted. Warning: This method may affect the order of keys! */
	delete( kv: KeyValueChild ): boolean {
		if (!(kv.key in this)) return false;

		// Adapted from https://stackoverflow.com/a/54270177
		this.values[this.values.indexOf(kv)] = this.values[this.values.length-1];
		this.values.pop();

		let i: number;
		for ( i=this.values.length-1; i>-1; i-- ) {
			if ( this.values[i].key === kv.key ) {
				this[kv.key] = this.values[i];
				break;
			};
		}

		if ( i === -1 ) delete this[kv.key];
		return true;
	}

	/** Adds a child to this set. */
	add( kv: KeyValueChild ): KeyValueChild {
		kv.parent = this;
		this[kv.key] = kv;
		this.values.push( kv );
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