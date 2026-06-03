import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const target = join(
  process.cwd(),
  'node_modules/@mlightcad/cad-simple-viewer/dist/index.js'
);

if (!existsSync(target)) {
  console.log('patch-mlightcad: package not installed, skipping.');
  process.exit(0);
}

let code = readFileSync(target, 'utf8');

const replacements = [
  ['"three/examples/jsm/controls/OrbitControls"', '"three/examples/jsm/controls/OrbitControls.js"'],
  ["'three/examples/jsm/controls/OrbitControls'", "'three/examples/jsm/controls/OrbitControls.js'"],
  ['"three/examples/jsm/libs/stats.module"', '"three/examples/jsm/libs/stats.module.js"'],
  ["'three/examples/jsm/libs/stats.module'", "'three/examples/jsm/libs/stats.module.js'"]
];

let changed = 0;
for (const [from, to] of replacements) {
  if (code.includes(from)) {
    code = code.split(from).join(to);
    changed++;
  }
}

if (changed > 0) {
  writeFileSync(target, code);
  console.log(`patch-mlightcad: updated ${changed} three.js import path(s).`);
} else {
  console.log('patch-mlightcad: no changes needed.');
}
