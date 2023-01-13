import { parse as cparse } from './parsecore.js';
import { KeyValue, KeyValueRoot, KeyValueSet } from './datatype.js';

export function fancy( data:string ): KeyValueRoot {
	let out: KeyValueSet|KeyValueRoot = new KeyValueRoot();

	cparse( data, {
		on_enter(key) {
			out.add(out = new KeyValueSet( key ));
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
	let ind = 0;

	cparse( data, {
		on_enter(key) {
			out.length = ind;
			out = out[ind] = { key, length: 0, _: out };
			ind = 0;
		},
		on_exit() {
			out.length = ind;
			out = out._;
			ind = out.length;
		},
		on_key(key, value, query) {
			ind++;
			out[ind] = { key, value, query };
		},
	});

	out.length = ind;
	return out;
}