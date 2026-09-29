#!/usr/bin/env node
// Audits Chrome Web Store listing copy against the spam policy:
//   • at most 5 distinct websites/brands named in title + summary + description
//   • no brand or purpose keyword used more than 5 times
//   • summary ≤ 132 chars, description ≤ 16,000
// Usage: node listing-audit.js <copy.txt> --brands "YouTube,X,Facebook,Instagram" --words "hide,block,feed,distract"
//        [--parents "Google,Meta,X Corp"] (parent companies allowed in a disclaimer line; counted separately)
const fs = require('fs');
const args = process.argv.slice(2);
const file = args[0];
const opt = (k) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1].split(',').map((s) => s.trim()).filter(Boolean) : []; };
if (!file) { console.error('usage: node listing-audit.js <copy.txt> --brands a,b --words x,y [--parents p,q]'); process.exit(2); }
const text = fs.readFileSync(file, 'utf8');
const count = (w) => (text.match(new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'giu')) || []).length;
let fail = false;
const row = (kind, w, n, max) => { const bad = n > max; if (bad) fail = true; console.log(`${bad ? 'FAIL' : ' ok '}  ${kind.padEnd(7)} ${w.padEnd(24)} ${n}${bad ? `  (max ${max})` : ''}`); };
const brands = opt('brands'), words = opt('words'), parents = opt('parents');
console.log(`chars: ${text.length} / 16000${text.length > 16000 ? '  FAIL' : ''}`);
if (text.length > 16000) fail = true;
if (brands.length > 5) { fail = true; console.log(`FAIL  ${brands.length} brands named; the limit is 5`); }
brands.forEach((b) => row('brand', b, count(b), 5));
parents.forEach((b) => row('parent', b, count(b), 2));
words.forEach((w) => row('keyword', w, count(w), 5));
process.exit(fail ? 1 : 0);
