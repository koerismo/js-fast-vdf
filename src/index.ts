import * as vdf from './parse.js';
import * as core from './core.js';
import { KeyV, KeyVSet, KeyVRoot } from './types.js';

const parse = vdf.parse, json = vdf.json;

export {
	vdf,
	core,

	// Pretend that vdf is the default module,
	// since those don't work with CommonJS.
	parse,
	json,

	KeyV,
	KeyVSet,
	KeyVRoot,
}