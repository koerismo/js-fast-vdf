export type KeyVChild = KeyV|KeyVSet;

/** Defines common methods between KeyValueSet and KeyValueRoot. */
class KeyVSetCommon {

	#values:	Array<KeyVChild> = [];
	parent:		KeyVSetCommon|null = null;

	any( key: string ): KeyVChild
	any( key: string, strict: true ): KeyVChild;
	any( key: string, strict: false|boolean ): KeyVChild|null;
	any( key: string, strict: boolean=true ): KeyVChild {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key ) return child;
		}

		if (strict && i === -1) throw(`Child with key "${key}" does not exist in set!`);
		return null;
	}

	dir( key: string ): KeyVSet;
	dir( key: string, strict: true ): KeyVSet;
	dir( key: string, strict: false|boolean ): KeyVSet|null;
	dir( key: string, strict: boolean=true ): KeyVSet {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key && child instanceof KeyVSet ) return child;
		}

		if (strict && i === -1) throw(`Subset with key "${key}" does not exist in set!`);
		return null;
	}

	pair( key: string ): KeyV;
	pair( key: string, strict: true ): KeyV;
	pair( key: string, strict: false|boolean ): KeyV|null;
	pair( key: string, strict: boolean=true ): KeyV {
		let i: number;
		for ( i=this.#values.length-1; i>-1; i-- ) {
			const child = this.#values[i];
			if (child.key === key && child instanceof KeyV ) return child;
		}

		if (strict && i === -1) throw(`Pair with key "${key}" does not exist in set!`);
		return null;
	}

	value( key: string ): string;
	value( key: string, strict: true ): string;
	value( key: string, strict: false|boolean ): string|null;
	value( key: string, strict: boolean=true ): string {
		return this.pair( key, strict )?.value;
	}

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