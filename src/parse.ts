import { parse as cparse, ParseOptions } from './parsecore.js';
import { KeyValue, KeyValueRoot, KeyValueSet } from './datatype.js';

export function fancy( data:string ): KeyValueRoot {
	let out: KeyValueSet|KeyValueRoot = new KeyValueRoot();

	cparse( data, {
		on_enter(key) {
			const child = new KeyValueSet( key );
			out.add( child );
			out = child;
		},
		on_exit() {
			if ( !out.parent ) throw( 'Attempted to exit past root keyvalue!' );
			out = out.parent;
		},
		on_key(key, value, query) {
			out.add(new KeyValue( key, value, query ));
		},
	});

	return out;
}

export function fast( data:string ) {
	let out = { length: 0, _:null };

	cparse( data, {
		on_enter(key) {
			out = out[out.length] = { key, length: 0, _: out };
			out.length++;
		},
		on_exit() {
			out = out._;
		},
		on_key(key, value, query) {
			out[out.length] = { key, value, query };
			out.length++;
		},
	});

	return out;
}