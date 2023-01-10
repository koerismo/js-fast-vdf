import { parse as cparse, ParseOptions } from './parsecore.js';

export function fancy( data:string ): Object {
	let out = { length: 0, _:null };

	cparse( data, {
		on_enter(key) {
			out = out[key] = out[out.length] = { key, length: 0, _: out };
			out.length++;
		},
		on_exit() {
			out = out._;
		},
		on_key(key, value, query) {
			out[key] = out[out.length] = { key, value, query };
			out.length++;
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