import { readFileSync } from 'node:fs';
import { vdf } from '../dist/index.js';

const TRIALS = 20;
const vmfString = readFileSync('./test/vmf/pl_goldrush_halloween.vmf', 'utf-8');
const start_vmf = performance.now();
var dummy;

for ( let i=0; i<TRIALS; i++ ) {
	dummy = vdf.parse(vmfString);
}

const end_vmf = performance.now();
console.log('Speedtest results ('+TRIALS+' runs):', (end_vmf-start_vmf) / TRIALS, 'ms');
dummy;