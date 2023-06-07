import { readFileSync } from 'node:fs';
import { vdf } from '../../dist/index.js';

const TRIALS = 20;
const vmfString = readFileSync('test/speed/pl_goldrush_halloween.vmf', 'utf-8');
const start_parse = performance.now();
var dummy_in, dummy_out;

for ( let i=0; i<TRIALS; i++ ) {
	dummy_in = vdf.parse(vmfString);
}

const end_parse = performance.now();

for ( let i=0; i<TRIALS; i++ ) {
	dummy_out = dummy_in.dump({ quote: 'always', indent: '\t' });
}

const end_dump = performance.now();
console.log(`
Speedtest results (${TRIALS} runs):
	Parsing: ${(end_parse-start_parse) / TRIALS} ms
	Dumping: ${(end_dump-end_parse) / TRIALS} ms
`);