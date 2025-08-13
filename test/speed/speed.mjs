import { readFileSync } from 'node:fs';
import { vdf } from '../../dist/index.js';
import { DumpQuotationType } from '../../dist/types.js';

const TRIALS = 20;
const vmfString = readFileSync('test/speed/pl_goldrush_halloween.vmf', 'utf-8');
var dummy_in, dummy_out;

function trial(parseOpts) {
	const start_parse = performance.now();

	for ( let i=0; i<TRIALS; i++ ) {
		dummy_in = vdf.parse(vmfString, parseOpts);
	}
	
	const end_parse = performance.now();
	
	for ( let i=0; i<TRIALS; i++ ) {
		dummy_out = dummy_in.dump({ quote: DumpQuotationType.Auto, indent: '\t', escapes: parseOpts.escapes });
	}
	
	const end_dump = performance.now();

	console.log(`
	Speedtest results (${TRIALS} runs) (${JSON.stringify(parseOpts)}):
		Parsing: ${(end_parse-start_parse) / TRIALS} ms
		Dumping: ${(end_dump-end_parse) / TRIALS} ms
	`);
}

trial({ escapes: false });
trial({ escapes: true });
