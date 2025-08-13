export * as vdf from './parse.js';
export * as core from './core.js';
export { parse, json, SharedParseOptions, type JsonSet } from './parse.js';
export { KeyV, KeyVSet, KeyVRoot, ParseError, DumpQuotationType, type KeyVChild, type ValueType } from './types.js';

import { parse } from './parse.js';
export default parse;
