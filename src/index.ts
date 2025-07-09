export * as vdf from './parse.js';
export * as core from './core.js';
export { parse, json } from './parse.js';
export { KeyV, KeyVSet, KeyVRoot, ParseError, type KeyVChild } from './types.js';

import { parse } from './parse.js';
export default parse;
